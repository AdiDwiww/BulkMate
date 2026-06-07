import { LayoutDashboard, UtensilsCrossed, Camera, Scale, MoreHorizontal, Wand2 } from 'lucide-react'

const mobileNavItems = [
  { id: 'dashboard',    label: 'Beranda',  icon: LayoutDashboard },
  { id: 'food-tracker', label: 'Makan',    icon: UtensilsCrossed },
  { id: 'ai-scanner',   label: 'Scan AI',  icon: Camera },
  { id: 'ai-planner',   label: 'Planner',  icon: Wand2 },
  { id: 'weight-tracker', label: 'Berat',  icon: Scale },
]

export default function MobileNav({ activePage, onPageChange, onMenuOpen }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {mobileNavItems.map(item => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-2xl transition-all duration-200 min-w-0"
              style={{
                color: isActive ? '#22c55e' : 'var(--text-muted)',
                background: isActive ? 'rgba(34,197,94,0.1)' : 'transparent',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div
                className="w-6 h-6 flex items-center justify-center"
                style={{ color: isActive ? '#22c55e' : 'var(--text-muted)' }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span
                className="text-center leading-tight"
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#22c55e' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}

        {/* More / Lainnya */}
        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-2xl transition-all duration-200"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <MoreHorizontal size={20} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  )
}
