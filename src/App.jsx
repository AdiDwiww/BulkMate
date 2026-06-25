import { useState, Suspense, lazy } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Onboarding from './pages/Onboarding'
import { Menu, Zap, Sun, Moon, Settings } from 'lucide-react'

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const FoodTracker = lazy(() => import('./pages/FoodTracker'))
const WeightTracker = lazy(() => import('./pages/WeightTracker'))
const AIMealPlanner = lazy(() => import('./pages/AIMealPlanner'))
const AIFoodScanner = lazy(() => import('./pages/AIFoodScanner'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const PAGE_TITLES = {
  'dashboard':      'BulkMate',
  'food-tracker':   'Food Tracker',
  'ai-scanner':     'AI Food Scanner',
  'weight-tracker': 'Berat Badan',
  'ai-planner':     'AI Meal Planner',
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

  // Onboarding: tampil jika belum pernah selesai onboarding
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem('bulkmate_onboarding_done')
  )

  const handleOnboardingComplete = () => {
    localStorage.setItem('bulkmate_onboarding_done', '1')
    setShowOnboarding(false)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  const handleNav = (page) => {
    setActivePage(page)
    setMobileMenuOpen(false)
    // Scroll to top saat pindah halaman di mobile
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':     return <Dashboard onPageChange={setActivePage} />
      case 'food-tracker':  return <FoodTracker />
      case 'ai-scanner':    return <AIFoodScanner />
      case 'weight-tracker':return <WeightTracker />
      case 'ai-planner':    return <AIMealPlanner />
      case 'settings':      return <SettingsPage />
      default:              return <Dashboard onPageChange={setActivePage} />
    }
  }

  const pageTitle = PAGE_TITLES[activePage] || 'BulkMate'

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop & Mobile overlay sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={handleNav}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto flex flex-col">

        {/* Mobile Top Header */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4"
          style={{
            height: '56px',
            background: 'var(--sidebar-bg)',
            borderBottom: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Menu size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
            {activePage === 'dashboard' ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg gradient-green flex items-center justify-center"
                  style={{ boxShadow: '0 2px 8px rgba(34,197,94,0.4)' }}
                >
                  <Zap size={14} color="white" />
                </div>
                <span className="font-black text-base" style={{ color: 'var(--text-primary)' }}>BulkMate</span>
              </div>
            ) : (
              <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{pageTitle}</span>
            )}
          </div>

          {/* Right: Theme toggle + Settings shortcut */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-secondary)' }}
            >
              {state.theme === 'dark'
                ? <Sun size={17} style={{ color: '#f97316' }} />
                : <Moon size={17} style={{ color: 'var(--text-secondary)' }} />
              }
            </button>
            <button
              onClick={() => handleNav('settings')}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: activePage === 'settings' ? 'rgba(34,197,94,0.12)' : 'var(--bg-secondary)',
              }}
            >
              <Settings size={17} style={{ color: activePage === 'settings' ? '#22c55e' : 'var(--text-secondary)' }} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        {/* Mobile: pt-4 pb-20. Desktop: pt-8 pb-8 */}
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 pb-20 md:pt-8 md:pb-8 md:px-6">
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
