import { useState, Suspense, lazy } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Onboarding from './pages/Onboarding'

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CalorieCalculator = lazy(() => import('./pages/CalorieCalculator'))
const FoodTracker = lazy(() => import('./pages/FoodTracker'))
const FavoriteFoods = lazy(() => import('./pages/FavoriteFoods'))
const SnackTracker = lazy(() => import('./pages/SnackTracker'))
const WeightTracker = lazy(() => import('./pages/WeightTracker'))
const MealReminders = lazy(() => import('./pages/MealReminders'))
const WeightPredictor = lazy(() => import('./pages/WeightPredictor'))
const BudgetTracker = lazy(() => import('./pages/BudgetTracker'))
const AIMealPlanner = lazy(() => import('./pages/AIMealPlanner'))
const AIFoodScanner = lazy(() => import('./pages/AIFoodScanner'))
const ProgressPhoto = lazy(() => import('./pages/ProgressPhoto'))
const NutritionWarning = lazy(() => import('./pages/NutritionWarning'))
const Analytics = lazy(() => import('./pages/Analytics'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function PageSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
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
  const { state } = useApp()
  const [activePage, setActivePage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Onboarding: tampil jika user benar-benar baru
  const isNewUser = !localStorage.getItem('bulkmate_onboarding_done') && !state.profile?.name
  const [showOnboarding, setShowOnboarding] = useState(isNewUser)

  const handleOnboardingComplete = () => {
    localStorage.setItem('bulkmate_onboarding_done', '1')
    setShowOnboarding(false)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':       return <Dashboard onPageChange={setActivePage} />
      case 'calculator':      return <CalorieCalculator onPageChange={setActivePage} />
      case 'food-tracker':    return <FoodTracker />
      case 'favorites':       return <FavoriteFoods />
      case 'snack-tracker':   return <SnackTracker />
      case 'weight-tracker':  return <WeightTracker />
      case 'reminders':       return <MealReminders />
      case 'predictor':       return <WeightPredictor />
      case 'budget':          return <BudgetTracker />
      case 'ai-planner':      return <AIMealPlanner />
      case 'ai-scanner':      return <AIFoodScanner />
      case 'progress-photo':  return <ProgressPhoto />
      case 'nutrition-warning': return <NutritionWarning />
      case 'analytics':       return <Analytics />
      case 'settings':        return <SettingsPage />
      default:                return <Dashboard onPageChange={setActivePage} />
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop & Mobile overlay sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={(page) => { setActivePage(page); setMobileMenuOpen(false) }}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile: pt-3 pb-24 (bottom nav height). Desktop: pt-8 pb-8 */}
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-24 md:pt-8 md:pb-8 md:px-6">
          <Suspense fallback={<PageSkeleton />}>
            {renderPage()}
          </Suspense>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav
        activePage={activePage}
        onPageChange={setActivePage}
        onMenuOpen={() => setMobileMenuOpen(true)}
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
