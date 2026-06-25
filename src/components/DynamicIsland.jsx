import { useState, useEffect, useRef } from 'react'
import { Bell, X, Clock, Sunrise, Sun, Moon, Cookie, UtensilsCrossed } from 'lucide-react'

const MEAL_META = {
  breakfast: { icon: Sunrise, color: '#f97316', label: 'Sarapan' },
  lunch:     { icon: Sun,     color: '#22c55e', label: 'Makan Siang' },
  dinner:    { icon: Moon,    color: '#6366f1', label: 'Makan Malam' },
  snack:     { icon: Cookie,  color: '#a855f7', label: 'Snack' },
}

export default function DynamicIsland({ alarm, onDismiss, onSnooze }) {
  const [phase, setPhase] = useState('idle') // idle | pill | expanded
  const autoRef = useRef(null)
  const expandRef = useRef(null)

  useEffect(() => {
    if (!alarm) { setPhase('idle'); return }
    setPhase('pill')
    expandRef.current = setTimeout(() => setPhase('expanded'), 300)

    autoRef.current = setTimeout(() => {
      setPhase('pill')
      setTimeout(() => { setPhase('idle'); onDismiss?.() }, 400)
    }, 12000)

    return () => {
      clearTimeout(expandRef.current)
      clearTimeout(autoRef.current)
    }
  }, [alarm])

  const dismiss = () => {
    clearTimeout(autoRef.current)
    setPhase('pill')
    setTimeout(() => { setPhase('idle'); onDismiss?.() }, 400)
  }

  const snooze = () => {
    clearTimeout(autoRef.current)
    setPhase('pill')
    setTimeout(() => { setPhase('idle'); onSnooze?.(alarm) }, 400)
  }

  if (phase === 'idle' || !alarm) return null

  const meta = MEAL_META[alarm.mealType] || MEAL_META.lunch
  const Icon = meta.icon
  const isExpanded = phase === 'expanded'

  return (
    <div style={{
      position: 'fixed', top: 14, left: '50%',
      transform: 'translateX(-50%)', zIndex: 9999,
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div
        onClick={() => !isExpanded && setPhase('expanded')}
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          borderRadius: isExpanded ? 28 : 50,
          overflow: 'hidden',
          transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          width: isExpanded ? 320 : 150,
          minHeight: isExpanded ? 120 : 38,
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,0.12)',
            `0 0 28px ${meta.color}50`,
            '0 12px 40px rgba(0,0,0,0.6)',
          ].join(', '),
          cursor: isExpanded ? 'default' : 'pointer',
          pointerEvents: 'all',
          position: 'relative',
        }}
      >
        {/* Pill collapsed */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '0 14px', height: 38,
          opacity: isExpanded ? 0 : 1,
          transition: 'opacity 0.2s',
          position: isExpanded ? 'absolute' : 'relative',
          width: '100%',
        }}>
          {/* Pulsing dot */}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: meta.color,
            animation: 'di-pulse 1s ease-in-out infinite',
          }} />
          <Bell size={13} color="white" />
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 0.2 }}>
            Waktunya {meta.label}!
          </span>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div style={{ padding: '16px 16px 14px', opacity: isExpanded ? 1 : 0, transition: 'opacity 0.3s 0.2s' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: `${meta.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${meta.color}40`,
                }}>
                  <Icon size={18} style={{ color: meta.color }} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{alarm.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    {alarm.time} · {meta.label}
                  </div>
                </div>
              </div>
              <button onClick={dismiss} style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <X size={13} color="rgba(255,255,255,0.7)" />
              </button>
            </div>

            {/* Glow bar */}
            <div style={{
              height: 3, borderRadius: 99, marginBottom: 12,
              background: `linear-gradient(90deg, ${meta.color}, ${meta.color}40)`,
            }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {alarm.snoozeEnabled && (
                <button onClick={snooze} style={{
                  flex: 1, padding: '8px 0', borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  Snooze {alarm.snoozeMinutes}m
                </button>
              )}
              <button onClick={dismiss} style={{
                flex: 1, padding: '8px 0', borderRadius: 12,
                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Siap Makan
              </button>
            </div>
          </div>
        )}

        {/* Animated glow ring */}
        <div style={{
          position: 'absolute', inset: -2, borderRadius: isExpanded ? 30 : 52,
          background: 'transparent',
          border: `2px solid ${meta.color}`,
          opacity: 0.3,
          animation: 'di-ring 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      </div>

      <style>{`
        @keyframes di-pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.5;transform:scale(1.4)}
        }
        @keyframes di-ring {
          0%,100%{opacity:0.25;transform:scale(1)}
          50%{opacity:0.6;transform:scale(1.04)}
        }
      `}</style>
    </div>
  )
}
