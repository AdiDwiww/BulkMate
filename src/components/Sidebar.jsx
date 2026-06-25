import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  LayoutDashboard, UtensilsCrossed, Scale, Wand2, Camera, Bell,
  Settings, ChevronLeft, ChevronRight, Zap, X, Sun, Moon
} from 'lucide-react'

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'food-tracker', label: 'Food Tracker',     icon: UtensilsCrossed },
  { id: 'ai-scanner',   label: 'AI Food Scanner',  icon: Camera },
  { id: 'weight-tracker',label: 'Berat Badan',    icon: Scale },
  { id: 'ai-planner',   label: 'AI Meal Planner',  icon: Wand2 },
  { id: 'reminders',    label: 'Pengingat Makan',  icon: Bell },
  { id: 'settings',     label: 'Pengaturan',       icon: Settings },
]

export default function Sidebar({ activePage, onPageChange, mobileOpen, setMobileOpen }) {
  const { state, dispatch } = useApp()
  const [collapsed, setCollapsed] = useState(false)

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })
  }

  const SidebarContent = ({ onNavClick }) => (
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
              {state.profile?.name?.charAt(0) || 'B'}
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
              onClick={() => onNavClick(item.id)}
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
        <button
          onClick={toggleTheme}
          className="sidebar-link w-full"
          title={collapsed ? (state.theme === 'dark' ? 'Light Mode' : 'Dark Mode') : ''}
        >
          {state.theme === 'dark'
            ? <Sun size={18} className="flex-shrink-0" />
            : <Moon size={18} className="flex-shrink-0" />}
          {!collapsed && <span className="text-sm">{state.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Collapse button - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full hidden md:flex"
        >
          {collapsed
            ? <ChevronRight size={18} className="flex-shrink-0" />
            : <ChevronLeft size={18} className="flex-shrink-0" />}
          {!collapsed && <span className="text-sm">Tutup Sidebar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'block',
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Mobile slide-in sidebar — always fixed, transform controls visibility */}
      <aside
        className="sidebar-mobile"
        style={{
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer',
          }}
        >
          <X size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <SidebarContent onNavClick={onPageChange} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="sidebar-desktop"
        style={{
          width: collapsed ? 64 : 256,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <SidebarContent onNavClick={onPageChange} />
      </aside>
    </>
  )
}
