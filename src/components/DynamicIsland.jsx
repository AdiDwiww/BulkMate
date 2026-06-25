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
  return { offsetX: 0, offsetY: 6 }
}

export default function DynamicIsland({ alarm, onDismiss, onSnooze }) {
  const [show, setShow]         = useState(false)   // apakah elemen di-render
  const [entering, setEntering] = useState(false)   // class animasi masuk
  const [expanded, setExpanded] = useState(false)   // pill → card
  const [leaving, setLeaving]   = useState(false)   // class animasi keluar
  const [camPos, setCamPos]     = useState(getCameraPosition)
  const autoRef   = useRef(null)
  const timerRefs = useRef([])

  const clearAll = () => {
    clearTimeout(autoRef.current)
    timerRefs.current.forEach(clearTimeout)
    timerRefs.current = []
  }

  const addTimer = (fn, ms) => {
    const id = setTimeout(fn, ms)
    timerRefs.current.push(id)
    return id
  }

  // Sync posisi kamera
  useEffect(() => {
    const onStorage = () => setCamPos(getCameraPosition())
    window.addEventListener('storage', onStorage)
    const poll = setInterval(() => setCamPos(getCameraPosition()), 2000)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll) }
  }, [])

  // Lifecycle: alarm berubah
  useEffect(() => {
    clearAll()

    if (!alarm) {
      // Tutup jika sedang terbuka
      if (show) closeAnim(onDismiss)
      return
    }

    // Mulai sequence: render → fade-in pill → expand → auto close
    setLeaving(false)
    setExpanded(false)
    setEntering(false)
    setShow(true)

    // Satu frame delay supaya animasi enter bisa berjalan
    addTimer(() => setEntering(true), 16)
    // Expand ke card setelah 350ms
    addTimer(() => setExpanded(true), 350)
    // Auto-dismiss setelah 10 detik
    autoRef.current = setTimeout(() => closeAnim(onDismiss), 10000)

    return clearAll
  }, [alarm]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Animasi keluar: mengecil lalu hilang */
  const closeAnim = (cb) => {
    clearAll()
    setExpanded(false)           // tutup card dulu (mengecil ke pill)
    addTimer(() => {
      setLeaving(true)           // pill mengecil + fade out
      addTimer(() => {
        setShow(false)           // baru hapus dari DOM
        setLeaving(false)
        setEntering(false)
        cb?.()
      }, 300)
    }, 280)
  }

  const dismiss = () => closeAnim(onDismiss)
  const snooze  = () => closeAnim(() => onSnooze?.(alarm))

  if (!show || !alarm) return null

  const meta = MEAL_META[alarm.mealType] || MEAL_META.lunch
  const Icon = meta.icon

  // ── Posisi: offsetX dari tengah, offsetY dari atas (default 6px = di kamera) ──
  const left = `calc(50% + ${camPos.offsetX || 0}px)`
  const top  = `${camPos.offsetY ?? 6}px`

  // ── Style island ──
  const islandStyle = {
    background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%)',
    borderRadius: expanded ? 26 : 50,
    width:     expanded ? 300 : 148,
    overflow:  'hidden',
    cursor:    expanded ? 'default' : 'pointer',
    pointerEvents: 'all',
    boxShadow: [
      '0 0 0 1px rgba(255,255,255,0.10)',
      `0 0 20px ${meta.color}40`,
      '0 6px 28px rgba(0,0,0,0.7)',
    ].join(', '),
    // Transisi ukuran (spring)
    transition: [
      'width 0.40s cubic-bezier(0.34,1.56,0.64,1)',
      'border-radius 0.40s cubic-bezier(0.34,1.56,0.64,1)',
    ].join(', '),
    // Animasi masuk/keluar via opacity + scale
    opacity:   (entering && !leaving) ? 1 : 0,
    transform: leaving
      ? 'translateX(-50%) scale(0.72)'      // KELUAR: mengecil
      : entering
        ? 'translateX(-50%) scale(1)'       // TAMPIL: normal
        : 'translateX(-50%) scale(0.82)',   // AWAL: kecil (siap masuk)
    transitionProperty: 'opacity, transform, width, border-radius',
    transitionDuration: leaving
      ? '0.28s, 0.28s, 0.40s, 0.40s'
      : '0.35s, 0.35s, 0.40s, 0.40s',
    transitionTimingFunction: leaving
      ? 'ease-in, ease-in, cubic-bezier(0.34,1.56,0.64,1), cubic-bezier(0.34,1.56,0.64,1)'
      : 'cubic-bezier(0.34,1.56,0.64,1), cubic-bezier(0.34,1.56,0.64,1), cubic-bezier(0.34,1.56,0.64,1), cubic-bezier(0.34,1.56,0.64,1)',
    position: 'relative',
  }

  return (
    <>
      <style>{`
        @keyframes di-pulse {
          0%,100%{ opacity:1; transform:scale(1) }
          50%{ opacity:0.5; transform:scale(1.4) }
        }
        @keyframes di-glow {
          0%,100%{ opacity:0.18 }
          50%{ opacity:0.50 }
        }
      `}</style>

      {/* Posisi tepat di kamera depan */}
      <div style={{
        position: 'fixed',
        top,
        left,
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        <div
          style={islandStyle}
          onClick={() => { if (!expanded) setExpanded(true) }}
        >
          {/* ── PILL ── */}
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
            transform: expanded ? 'scale(0.8)' : 'scale(1)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
            pointerEvents: expanded ? 'none' : 'auto',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: meta.color, flexShrink: 0,
              animation: 'di-pulse 1.2s ease-in-out infinite',
            }} />
            <Bell size={12} color="white" />
            <span style={{
              color: '#fff', fontSize: 11.5, fontWeight: 700,
              letterSpacing: 0.1, whiteSpace: 'nowrap',
            }}>
              Waktunya {meta.label}!
            </span>
          </div>

          {/* ── EXPANDED ── */}
          <div style={{
            padding: '13px 13px 11px',
            // Hanya tampil saat expanded, fade in smooth
            opacity:    expanded ? 1 : 0,
            transform:  expanded ? 'translateY(0)' : 'translateY(-6px)',
            transition: 'opacity 0.25s ease 0.18s, transform 0.25s ease 0.18s',
            pointerEvents: expanded ? 'auto' : 'none',
            // Ruang untuk pill saat collapsed
            minHeight: 36,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 33, height: 33, borderRadius: 10, flexShrink: 0,
                  background: `${meta.color}20`,
                  border: `1px solid ${meta.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color: meta.color }} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                    {alarm.label}
                  </div>
                  <div style={{
                    color: 'rgba(255,255,255,0.4)', fontSize: 10.5, marginTop: 2,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <Clock size={9} />{alarm.time} · {meta.label}
                  </div>
                </div>
              </div>
              <button onClick={dismiss} style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(255,255,255,0.09)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}>
                <X size={12} color="rgba(255,255,255,0.6)" />
              </button>
            </div>

            {/* Accent line */}
            <div style={{
              height: 2, borderRadius: 99, marginBottom: 10,
              background: `linear-gradient(90deg, ${meta.color}, ${meta.color}30)`,
            }} />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {alarm.snoozeEnabled && (
                <button onClick={snooze} style={{
                  flex: 1, padding: '7px 0', borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  Snooze {alarm.snoozeMinutes}m
                </button>
              )}
              <button onClick={dismiss} style={{
                flex: 1, padding: '7px 0', borderRadius: 10,
                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)`,
                border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Siap Makan
              </button>
            </div>
          </div>

          {/* Glow ring */}
          <div style={{
            position: 'absolute', inset: -1, pointerEvents: 'none',
            borderRadius: expanded ? 27 : 51,
            border: `1.5px solid ${meta.color}`,
            opacity: 0.22,
            animation: 'di-glow 2.5s ease-in-out infinite',
            transition: 'border-radius 0.40s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
      </div>
    </>
  )
}
