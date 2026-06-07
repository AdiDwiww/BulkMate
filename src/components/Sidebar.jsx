import { useApp } from '../context/AppContext'
import { useState } from 'react'
import { 
  LayoutDashboard, Calculator, UtensilsCrossed, Heart, ShoppingBag, 
  Scale, Bell, Target, Wallet, Wand2, Camera, Image, Brain, 
  BarChart3, Settings, ChevronLeft, ChevronRight, Zap, X, Menu
} from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calculator', label: 'Kalkulator Kalori', icon: Calculator },
  { id: 'food-tracker', label: 'Food Tracker', icon: UtensilsCrossed },
  { id: 'favorites', label: 'Makanan Favorit', icon: Heart },
  { id: 'snack-tracker', label: 'Tracker Jajan', icon: ShoppingBag },
  { id: 'weight-tracker', label: 'Berat Badan', icon: Scale },
  { id: 'reminders', label: 'Pengingat Makan', icon: Bell },
  { id: 'predictor', label: 'Prediksi Target', icon: Target },
  { id: 'budget', label: 'Budget Tracker', icon: Wallet },
  { id: 'ai-planner', label: 'AI Meal Planner', icon: Wand2 },
  { id: 'ai-scanner', label: 'AI Food Scanner', icon: Camera },
  { id: 'progress-photo', label: 'Progress Photo', icon: Image },
  { id: 'nutrition-warning', label: 'Nutrition Warning', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar({ activePage, onPageChange }) {
  const { state, dispatch } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center flex-shrink-0 shadow-lg"
               style={{ boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}>
            <Zap size={18} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>BulkMate</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Bulking Assistant</div>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-green flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {state.profile?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {state.profile?.name || 'User'}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {state.profile?.weight}kg → {state.profile?.target_weight}kg
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                onPageChange(item.id)
                setMobileOpen(false)
              }}
              className={`sidebar-link w-full text-left ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Bottom controls */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="sidebar-link w-full"
          title={collapsed ? (state.theme === 'dark' ? 'Light Mode' : 'Dark Mode') : ''}
        >
          <span className="text-base flex-shrink-0">{state.theme === 'dark' ? '☀️' : '🌙'}</span>
          {!collapsed && <span className="text-sm">{state.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        
        {/* Collapse button - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full hidden md:flex"
        >
          {collapsed ? <ChevronRight size={18} className="flex-shrink-0" /> : <ChevronLeft size={18} className="flex-shrink-0" />}
          {!collapsed && <span className="text-sm">Tutup Sidebar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <Menu size={20} style={{ color: 'var(--text-primary)' }} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full z-50 w-72 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)' }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <X size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)' }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
