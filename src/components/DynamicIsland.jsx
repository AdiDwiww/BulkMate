import { useState, useEffect, useRef } from 'react'
import { Bell, X, Clock, Sunrise, Sun, Moon, Cookie } from 'lucide-react'

const MEAL_META = {
  breakfast: { icon: Sunrise, color: '#f97316', label: 'Sarapan' },
  lunch:     { icon: Sun,     color: '#22c55e', label: 'Makan Siang' },
  dinner:    { icon: Moon,    color: '#6366f1', label: 'Makan Malam' },
  snack:     { icon: Cookie,  color: '#a855f7', label: 'Snack' },
}

function getCameraPosition() {
  try {
    const saved = localStorage.getItem('bulkmate_camera_position')
    if (saved) return JSON.parse(saved)
  } catch {}
  return { offsetX: 0, offsetY: 0 }
}

export default function DynamicIsland({ alarm, onDismiss, onSnooze }) {
  // visible: apakah island tampil sama sekali
  // expanded: pill → expanded
  const [visible, setVisible]   = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted]   = useState(false) // untuk animasi masuk
  const [camPos, setCamPos]     = useState(getCameraPosition)
  const autoRef    = useRef(null)
  const expandRef  = useRef(null)
  const dismissRef = useRef(null)

  // Sync posisi kamera
  useEffect(() => {
    const onStorage = () => setCamPos(getCameraPosition())
    window.addEventListener('storage', onStorage)
    const poll = setInterval(() => setCamPos(getCameraPosition()), 2000)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll) }
  }, [])

  // Saat alarm berubah
  useEffect(() => {
    // Clear semua timer lama
    clearTimeout(autoRef.current)
    clearTimeout(expandRef.current)
    clearTimeout(dismissRef.current)

    if (!alarm) {
      // Tutup dengan animasi
      setExpanded(false)
      dismissRef.current = setTimeout(() => {
        setMounted(false)
        setTimeout(() => setVisible(false), 350)
      }, 200)
      return
    }

    // Munculkan island
    setVisible(true)
    setExpanded(false)
    setMounted(false)

    // Step 1: mount (fade-in pill)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })

    // Step 2: expand ke full card setelah 400ms
    expandRef.current = setTimeout(() => setExpanded(true), 400)

    // Step 3: auto-dismiss setelah 12 detik
    autoRef.current = setTimeout(() => {
      setExpanded(false)
      setTimeout(() => {
        setMounted(false)
        setTimeout(() => { setVisible(false); onDismiss?.() }, 350)
      }, 350)
    }, 12000)

    return () => {
      clearTimeout(autoRef.current)
      clearTimeout(expandRef.current)
      clearTimeout(dismissRef.current)
    }
  }, [alarm]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    clearTimeout(autoRef.current)
    setExpanded(false)
    setTimeout(() => {
      setMounted(false)
      setTimeout(() => { setVisible(false); onDismiss?.() }, 350)
    }, 300)
  }

  const snooze = () => {
    clearTimeout(autoRef.current)
    setExpanded(false)
    setTimeout(() => {
      setMounted(false)
      setTimeout(() => { setVisible(false); onSnooze?.(alarm) }, 350)
    }, 300)
  }

  if (!visible || !alarm) return null

  const meta   = MEAL_META[alarm.mealType] || MEAL_META.lunch
  const Icon   = meta.icon

  // Posisi
  const translateX = `calc(-50% + ${camPos.offsetX || 0}px)`
  const topOffset  = `max(env(safe-area-inset-top, 8px), ${8 + (camPos.offsetY || 0)}px)`

  return (
    <>
      <style>{`
        @keyframes di-pulse {
          0%,100%{ opacity:1; transform:scale(1) }
          50%{ opacity:0.55; transform:scale(1.35) }
        }
        @keyframes di-glow {
          0%,100%{ opacity:0.2; transform:scale(1) }
          50%{ opacity:0.55; transform:scale(1.05) }
        }
        @keyframes di-fadein {
          from { opacity:0; transform:translateY(-12px) scale(0.92) }
          to   { opacity:1; transform:translateY(0)    scale(1)    }
        }
        @keyframes di-fadeout {
          from { opacity:1; transform:translateY(0)    scale(1)    }
          to   { opacity:0; transform:translateY(-10px) scale(0.94) }
        }
      `}</style>

      {/* Wrapper posisi */}
      <div style={{
        position: 'fixed',
        top: topOffset,
        left: '50%',
        transform: `translateX(${translateX})`,
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        {/* Island container */}
        <div
          style={{
            background: 'linear-gradient(145deg, #0d0d0d 0%, #1c1c1c 100%)',
            borderRadius: expanded ? 26 : 50,
            overflow: 'hidden',
            pointerEvents: 'all',
            cursor: expanded ? 'default' : 'pointer',
            boxShadow: [
              '0 0 0 1px rgba(255,255,255,0.10)',
              `0 0 24px ${meta.color}45`,
              '0 8px 32px rgba(0,0,0,0.65)',
            ].join(', '),
            // Animasi masuk/keluar
            animation: mounted
              ? 'di-fadein 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards'
              : 'di-fadeout 0.32s ease-in forwards',
            // Size transition
            width:     expanded ? 300 : 148,
            minHeight: expanded ? 'auto' : 36,
            transition: [
              'width 0.42s cubic-bezier(0.34,1.56,0.64,1)',
              'border-radius 0.42s cubic-bezier(0.34,1.56,0.64,1)',
              'box-shadow 0.3s ease',
            ].join(', '),
            position: 'relative',
          }}
          onClick={() => { if (!expanded) setExpanded(true) }}
        >

          {/* ── PILL (collapsed) ─────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            padding: '0 14px',
            height: 36,
            position: 'absolute',
            top: 0, left: 0, right: 0,
            opacity:   expanded ? 0 : 1,
            transform: expanded ? 'scale(0.85)' : 'scale(1)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
            pointerEvents: expanded ? 'none' : 'auto',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: meta.color,
              animation: 'di-pulse 1.2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <Bell size={12} color="white" />
            <span style={{
              color: '#fff', fontSize: 11.5, fontWeight: 700,
              letterSpacing: 0.15, whiteSpace: 'nowrap',
            }}>
              Waktunya {meta.label}!
            </span>
          </div>

          {/* ── EXPANDED content ─────────────────────────────── */}
          <div style={{
            padding: '14px 14px 12px',
            opacity:    expanded ? 1 : 0,
            transform:  expanded ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.28s ease 0.15s, transform 0.28s ease 0.15s',
            // Give the pill height room before expanding
            marginTop: expanded ? 0 : 36,
            pointerEvents: expanded ? 'auto' : 'none',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 11,
                  background: `${meta.color}22`,
                  border: `1px solid ${meta.color}38`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={17} style={{ color: meta.color }} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 13.5, lineHeight: 1.2 }}>
                    {alarm.label}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10.5, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={9} />
                    {alarm.time} · {meta.label}
                  </div>
                </div>
              </div>
              <button onClick={dismiss} style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}>
                <X size={12} color="rgba(255,255,255,0.65)" />
              </button>
            </div>

            {/* Accent bar */}
            <div style={{
              height: 2.5, borderRadius: 99, marginBottom: 10,
              background: `linear-gradient(90deg, ${meta.color}, ${meta.color}33)`,
            }} />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 7 }}>
              {alarm.snoozeEnabled && (
                <button onClick={snooze} style={{
                  flex: 1, padding: '8px 0', borderRadius: 11,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  Snooze {alarm.snoozeMinutes}m
                </button>
              )}
              <button onClick={dismiss} style={{
                flex: 1, padding: '8px 0', borderRadius: 11,
                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)`,
                border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Siap Makan
              </button>
            </div>
          </div>

          {/* Glow ring */}
          <div style={{
            position: 'absolute', inset: -1.5,
            borderRadius: expanded ? 27.5 : 51.5,
            border: `1.5px solid ${meta.color}`,
            opacity: 0.25,
            animation: 'di-glow 2.5s ease-in-out infinite',
            pointerEvents: 'none',
            transition: 'border-radius 0.42s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
      </div>
    </>
  )
}
