import { LayoutDashboard, UtensilsCrossed, Camera, Scale, Wand2 } from 'lucide-react'

const mobileNavItems = [
  { id: 'dashboard',      label: 'Beranda', icon: LayoutDashboard },
  { id: 'food-tracker',   label: 'Makan',   icon: UtensilsCrossed },
  { id: 'ai-scanner',     label: 'Scan AI', icon: Camera },
  { id: 'ai-planner',     label: 'AI Plan', icon: Wand2 },
  { id: 'weight-tracker', label: 'Berat',   icon: Scale },
]

export default function MobileNav({ activePage, onPageChange }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-end justify-around px-1 pt-1.5 pb-2">
        {mobileNavItems.map(item => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className="flex flex-col items-center gap-1 min-w-0 flex-1 relative"
              style={{ paddingTop: '6px', paddingBottom: '2px' }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 w-5 h-1 rounded-full"
                  style={{
                    background: '#22c55e',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                  }}
                />
              )}

              {/* Icon container */}
              <div
                className="w-11 h-7 flex items-center justify-center rounded-2xl transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(34,197,94,0.12)' : 'transparent',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? '#22c55e' : 'var(--text-muted)' }}
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#22c55e' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
