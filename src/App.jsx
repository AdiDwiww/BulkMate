import { useState, Suspense, lazy, useEffect, useRef } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Onboarding from './pages/Onboarding'
import DynamicIsland from './components/DynamicIsland'
import { Menu, Zap, Sun, Moon, Settings } from 'lucide-react'
import { shouldFireNow, playAlarmSound, swNotify, registerSW } from './utils/alarmEngine'

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const FoodTracker = lazy(() => import('./pages/FoodTracker'))
const WeightTracker = lazy(() => import('./pages/WeightTracker'))
const AIMealPlanner = lazy(() => import('./pages/AIMealPlanner'))
const AIFoodScanner = lazy(() => import('./pages/AIFoodScanner'))
const MealReminders = lazy(() => import('./pages/MealReminders'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const PAGE_TITLES = {
  'dashboard':      'BulkMate',
  'food-tracker':   'Food Tracker',
  'ai-scanner':     'AI Food Scanner',
  'weight-tracker': 'Berat Badan',
  'ai-planner':     'AI Meal Planner',
  'reminders':      'Pengingat Makan',
  'settings':       'Pengaturan',
}

function PageSkeleton() {
  return (
    <div className="space-y-4 p-1 animate-fade-in">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="skeleton h-4 w-72 rounded-lg" />
      <div className="skeleton h-48 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-28 rounded-xl" />
        <div className="skeleton h-28 rounded-xl" />
        <div className="skeleton h-28 rounded-xl" />
      </div>
    </div>
  )
}

function AppContent() {
  const { state, dispatch } = useApp()
  const [activePage, setActivePage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeAlarm, setActiveAlarm] = useState(null)
  const firedRef = useRef(new Set())

  // Register Service Worker once
  useEffect(() => { registerSW() }, [])

  // Alarm engine — cek setiap 30 detik
  useEffect(() => {
    const check = () => {
      const reminders = state.reminders || []
      const now = new Date()
      const minuteKey = `${now.getHours()}:${now.getMinutes()}`

      // Reset fired set setiap menit baru
      if (firedRef.current._lastMinute !== minuteKey) {
        firedRef.current = new Set()
        firedRef.current._lastMinute = minuteKey
      }

      reminders.forEach(r => {
        if (!r.enabled) return
        if (firedRef.current.has(r.id)) return
        if (!shouldFireNow(r)) return

        firedRef.current.add(r.id)

        // 1. Bunyi alarm
        playAlarmSound(r.sound, r.repeatCount)

        // 2. Dynamic Island in-app
        setActiveAlarm(r)

        // 3. Native notification (lock screen)
        const title = `🍽️ ${r.label}`
        const body = `Waktunya ${r.label}! Jangan lupa catat makanmu.`
        swNotify(title, body, `alarm-${r.id}`, r.snoozeMinutes)
      })
    }

    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [state.reminders])

  // Handle snooze dari DynamicIsland
  const handleSnooze = (alarm) => {
    if (!alarm) return
    setTimeout(() => {
      playAlarmSound(alarm.sound, alarm.repeatCount)
      setActiveAlarm({ ...alarm, _snoozed: true })
      swNotify(`⏰ ${alarm.label}`, 'Snooze selesai! Waktunya makan.', `alarm-${alarm.id}-snooze`, alarm.snoozeMinutes)
    }, (alarm.snoozeMinutes || 5) * 60 * 1000)
  }

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem('bulkmate_onboarding_done')
  )
  const handleOnboardingComplete = () => {
    localStorage.setItem('bulkmate_onboarding_done', '1')
    setShowOnboarding(false)
  }
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />

  const handleNav = (page) => {
    setActivePage(page)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':     return <Dashboard onPageChange={setActivePage} />
      case 'food-tracker':  return <FoodTracker />
      case 'ai-scanner':    return <AIFoodScanner />
      case 'weight-tracker':return <WeightTracker />
      case 'ai-planner':    return <AIMealPlanner />
      case 'reminders':     return <MealReminders />
      case 'settings':      return <SettingsPage />
      default:              return <Dashboard onPageChange={setActivePage} />
    }
  }

  const pageTitle = PAGE_TITLES[activePage] || 'BulkMate'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Dynamic Island alarm notification */}
      <DynamicIsland
        alarm={activeAlarm}
        onDismiss={() => setActiveAlarm(null)}
        onSnooze={(a) => { setActiveAlarm(null); handleSnooze(a) }}
      />

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={handleNav}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Mobile Top Header */}
        <header className="mobile-header">
          {/* Left: Hamburger + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}
            >
              <Menu size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
            {activePage === 'dashboard' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  className="gradient-green"
                  style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(34,197,94,0.4)' }}
                >
                  <Zap size={14} color="white" />
                </div>
                <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)' }}>BulkMate</span>
              </div>
            ) : (
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{pageTitle}</span>
            )}
          </div>

          {/* Right: Theme toggle + Settings shortcut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })}
              style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}
            >
              {state.theme === 'dark'
                ? <Sun size={17} style={{ color: '#f97316' }} />
                : <Moon size={17} style={{ color: 'var(--text-secondary)' }} />}
            </button>
            <button
              onClick={() => handleNav('settings')}
              style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: activePage === 'settings' ? 'rgba(34,197,94,0.12)' : 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}
            >
              <Settings size={17} style={{ color: activePage === 'settings' ? '#22c55e' : 'var(--text-secondary)' }} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, maxWidth: 672, margin: '0 auto', width: '100%', padding: '16px 16px 80px' }}>
          <Suspense fallback={<PageSkeleton />}>
            {renderPage()}
          </Suspense>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav
        activePage={activePage}
        onPageChange={handleNav}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
