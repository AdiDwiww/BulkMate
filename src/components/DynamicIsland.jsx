import { useState, useEffect, useRef } from 'react'
import { Bell, X, Clock, Sunrise, Sun, Moon, Cookie } from 'lucide-react'

const MEAL_META = {
  breakfast: { icon: Sunrise, color: '#f97316', label: 'Sarapan' },
  lunch:     { icon: Sun,     color: '#22c55e', label: 'Makan Siang' },
  dinner:    { icon: Moon,    color: '#6366f1', label: 'Makan Malam' },
  snack:     { icon: Cookie,  color: '#a855f7', label: 'Snack' },
}

// Tinggi expanded (px) — sesuaikan jika konten berubah
const PILL_H     = 36
const EXPANDED_H = 122

function getCameraPosition() {
  try {
    const saved = localStorage.getItem('bulkmate_camera_position')
    if (saved) return JSON.parse(saved)
  } catch {}
  return { offsetX: 0, offsetY: 6 }
}

export default function DynamicIsland({ alarm, onDismiss, onSnooze }) {
  const [show, setShow]         = useState(false)
  const [entering, setEntering] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [leaving, setLeaving]   = useState(false)
  const [camPos, setCamPos]     = useState(getCameraPosition)
  const timers = useRef([])

  const addTimer = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id) }
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  useEffect(() => {
    const onStorage = () => setCamPos(getCameraPosition())
    window.addEventListener('storage', onStorage)
    const poll = setInterval(() => setCamPos(getCameraPosition()), 2000)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll) }
  }, [])

  useEffect(() => {
    clearAll()

    if (!alarm) {
      if (show) doClose(onDismiss)
      return
    }

    // Masuk: render → entering (fade+scale masuk) → expand
    setLeaving(false)
    setExpanded(false)
    setEntering(false)
    setShow(true)
    addTimer(() => setEntering(true), 16)
    addTimer(() => setExpanded(true), 380)

    // Auto dismiss setelah 10 detik
    addTimer(() => doClose(onDismiss), 10000)

    return clearAll
  }, [alarm]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Urutan tutup:
   * 1. expanded → false  (width: 300→148, height: EXPANDED→PILL, spring 400ms)
   * 2. tunggu 420ms sampai animasi lebar+tinggi selesai
   * 3. leaving → true    (scale(0.6) + opacity:0 pada pill kecil, 260ms)
   * 4. show → false
   */
  const doClose = (cb) => {
    clearAll()
    setExpanded(false)                        // 1. collapse to pill
    addTimer(() => {
      setLeaving(true)                        // 2. shrink pill + fade
      addTimer(() => {
        setShow(false)
        setLeaving(false)
        setEntering(false)
        cb?.()
      }, 270)
    }, 420)
  }

  const dismiss = () => doClose(onDismiss)
  const snooze  = () => doClose(() => onSnooze?.(alarm))

  if (!show || !alarm) return null

  const meta = MEAL_META[alarm.mealType] || MEAL_META.lunch
  const Icon = meta.icon

  // Posisi horizontal + vertikal (di kamera)
  const left = `calc(50% + ${camPos.offsetX || 0}px)`
  const top  = `${camPos.offsetY ?? 6}px`

  // ── State-based style ──
  const opacity   = (entering && !leaving) ? 1 : 0
  const scaleVal  = leaving ? 0.60 : entering ? 1 : 0.80
  const transform = `translateX(-50%) scale(${scaleVal})`

  const TRANSITION_SPEED = '0.40s cubic-bezier(0.34,1.56,0.64,1)'
  const FADE_SPEED = leaving ? '0.25s ease-in' : '0.32s cubic-bezier(0.34,1.56,0.64,1)'

  return (
    <>
      <style>{`
        @keyframes di-pulse {
          0%,100%{ opacity:1; transform:scale(1) }
          50%{ opacity:0.5; transform:scale(1.4) }
        }
        @keyframes di-glow {
          0%,100%{ opacity:0.15 }
          50%{ opacity:0.45 }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top,
        left,
        zIndex: 9999,
        pointerEvents: 'none',
        // Opacity + scale animasi masuk/keluar
        opacity,
        transform,
        transition: `opacity ${FADE_SPEED}, transform ${FADE_SPEED}`,
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #0a0a0a 0%, #1c1c1c 100%)',
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,0.10)',
            `0 0 20px ${meta.color}40`,
            '0 8px 32px rgba(0,0,0,0.75)',
          ].join(', '),
          cursor: expanded ? 'default' : 'pointer',
          pointerEvents: 'all',
          overflow: 'hidden',
          position: 'relative',
          // ── Transisi ukuran (width + height + radius) serentak ──
          width:        expanded ? 300 : 148,
          height:       expanded ? EXPANDED_H : PILL_H,
          borderRadius: expanded ? 26  : 50,
          transition: [
            `width        ${TRANSITION_SPEED}`,
            `height       ${TRANSITION_SPEED}`,
            `border-radius ${TRANSITION_SPEED}`,
          ].join(', '),
        }}
          onClick={() => { if (!expanded) setExpanded(true) }}
        >

          {/* ── PILL ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: PILL_H,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '0 14px',
            opacity:   expanded ? 0 : 1,
            transform: expanded ? 'scale(0.82)' : 'scale(1)',
            transition: 'opacity 0.20s ease, transform 0.20s ease',
            pointerEvents: expanded ? 'none' : 'auto',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: meta.color, flexShrink: 0,
              animation: 'di-pulse 1.2s ease-in-out infinite',
            }} />
            <Bell size={12} color="white" />
            <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.1, whiteSpace: 'nowrap' }}>
              Waktunya {meta.label}!
            </span>
          </div>

          {/* ── EXPANDED ── */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            padding: '12px 13px 11px',
            opacity:   expanded ? 1 : 0,
            transform: expanded ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.22s ease 0.20s, transform 0.22s ease 0.20s',
            pointerEvents: expanded ? 'auto' : 'none',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: `${meta.color}20`, border: `1px solid ${meta.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color: meta.color }} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{alarm.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
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
            <div style={{ height: 2, borderRadius: 99, marginBottom: 9, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}30)` }} />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {alarm.snoozeEnabled && (
                <button onClick={snooze} style={{
                  flex: 1, padding: '7px 0', borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Snooze {alarm.snoozeMinutes}m</button>
              )}
              <button onClick={dismiss} style={{
                flex: 1, padding: '7px 0', borderRadius: 10,
                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)`,
                border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Siap Makan</button>
            </div>
          </div>

          {/* Glow ring */}
          <div style={{
            position: 'absolute', inset: -1, pointerEvents: 'none',
            borderRadius: expanded ? 27 : 51,
            border: `1.5px solid ${meta.color}`,
            opacity: 0.18, animation: 'di-glow 2.5s ease-in-out infinite',
            transition: `border-radius ${TRANSITION_SPEED}`,
          }} />
        </div>
      </div>
    </>
  )
}
