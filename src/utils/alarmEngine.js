// Alarm sound engine — Web Audio API
export function playAlarmSound(type = 'bell', repeatCount = 3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    for (let i = 0; i < repeatCount; i++) {
      const t = ctx.currentTime + i * 0.65

      if (type === 'bell') {
        // Bell: sine + decay
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, t)
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.35)
        gain.gain.setValueAtTime(0.55, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
        osc.start(t); osc.stop(t + 0.6)

      } else if (type === 'chime') {
        // Chime: 3 ascending notes
        const notes = [523, 659, 784]
        notes.forEach((freq, j) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'triangle'
          const nt = t + j * 0.18
          osc.frequency.setValueAtTime(freq, nt)
          gain.gain.setValueAtTime(0.45, nt)
          gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.4)
          osc.start(nt); osc.stop(nt + 0.45)
        })

      } else if (type === 'beep') {
        // Short digital beep
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'square'
        osc.frequency.setValueAtTime(1000, t)
        gain.gain.setValueAtTime(0.25, t)
        gain.gain.setValueAtTime(0.25, t + 0.1)
        gain.gain.setValueAtTime(0, t + 0.12)
        osc.start(t); osc.stop(t + 0.15)
      }
      // 'none': no sound
    }
    return ctx
  } catch {
    return null
  }
}

const DAYS_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// Cek apakah alarm harus bunyi sekarang
export function shouldFireNow(reminder) {
  const now = new Date()
  const [h, m] = reminder.time.split(':').map(Number)
  if (now.getHours() !== h || now.getMinutes() !== m) return false

  const dayName = DAYS_SHORT[now.getDay()]
  if (reminder.days === 'daily') return true
  if (reminder.days === 'weekdays') return ['mon','tue','wed','thu','fri'].includes(dayName)
  if (reminder.days === 'weekends') return ['sat','sun'].includes(dayName)
  if (Array.isArray(reminder.days)) return reminder.days.includes(dayName)
  return false
}

// Format nama hari
export const DAY_LABELS = { sun:'Min', mon:'Sen', tue:'Sel', wed:'Rab', thu:'Kam', fri:'Jum', sat:'Sab' }
export const ALL_DAYS = ['mon','tue','wed','thu','fri','sat','sun']

export function formatDays(days) {
  if (days === 'daily') return 'Setiap Hari'
  if (days === 'weekdays') return 'Senin–Jumat'
  if (days === 'weekends') return 'Sabtu–Minggu'
  if (Array.isArray(days)) return days.map(d => DAY_LABELS[d]).join(', ')
  return '-'
}

// Kirim notifikasi ke Service Worker (background)
export function swNotify(title, body, tag, snoozeMinutes = 5) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { title, body, tag, snoozeMinutes },
    })
  }
}

// Minta izin notifikasi
export async function requestNotifPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

// Register service worker
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (e) {
    console.warn('SW register failed:', e)
  }
}
