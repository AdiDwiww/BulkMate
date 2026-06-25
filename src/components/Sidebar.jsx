import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  LayoutDashboard, UtensilsCrossed, Scale, Wand2, Camera, Bell,
  Settings, ChevronLeft, ChevronRight, Zap, X, Sun, Moon
} from 'lucide-react'

const navItems = [
  { id: 'dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'food-tracker',  label: 'Food Tracker',    icon: UtensilsCrossed },
  { id: 'ai-scanner',   label: 'AI Food Scanner',  icon: Camera },
  { id: 'weight-tracker',label: 'Berat Badan',     icon: Scale },
  { id: 'ai-planner',   label: 'AI Meal Planner',  icon: Wand2 },
  { id: 'reminders',    label: 'Pengingat Makan',  icon: Bell },
  { id: 'settings',     label: 'Pengaturan',       icon: Settings },
]

export default function Sidebar({ activePage, onPageChange, mobileOpen, setMobileOpen }) {
  const { state, dispatch } = useApp()
  const [collapsed, setCollapsed] = useState(false)

  const toggleTheme = () =>
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })

  const SidebarContent = ({ onNavClick }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="gradient-green"
            style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}
          >
            <Zap size={18} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.2 }}>BulkMate</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bulking Assistant</div>
            </div>
          )}
        </div>
      </div>

      {/* User card */}
      {!collapsed && (
        <div style={{ margin: '12px', borderRadius: 12, padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="gradient-green"
              style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}
            >
              {state.profile?.name?.charAt(0) || 'B'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.profile?.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {state.profile?.weight}kg → {state.profile?.target_weight}kg
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavClick(item.id)}
              className={`sidebar-link${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : ''}
              style={{ width: '100%', textAlign: 'left', justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button
          onClick={toggleTheme}
          className="sidebar-link"
          title={collapsed ? (state.theme === 'dark' ? 'Light Mode' : 'Dark Mode') : ''}
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          {state.theme === 'dark'
            ? <Sun size={18} style={{ flexShrink: 0 }} />
            : <Moon size={18} style={{ flexShrink: 0 }} />}
          {!collapsed && <span style={{ fontSize: 14 }}>{state.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Collapse toggle — desktop only via sidebar-desktop visibility */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link sidebar-collapse-btn"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          {collapsed
            ? <ChevronRight size={18} style={{ flexShrink: 0 }} />
            : <ChevronLeft size={18} style={{ flexShrink: 0 }} />}
          {!collapsed && <span style={{ fontSize: 14 }}>Tutup Sidebar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Mobile slide-in */}
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
          style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', zIndex: 1 }}
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
