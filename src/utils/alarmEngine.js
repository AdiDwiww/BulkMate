// Alarm sound engine — Web Audio API
export function playAlarmSound(type = 'bell', repeatCount = 3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    for (let i = 0; i < repeatCount; i++) {
      const t = ctx.currentTime + i * 0.65

      if (type === 'bell') {
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
    }
    return ctx
  } catch {
    return null
  }
}

const DAYS_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

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

export const DAY_LABELS = { sun:'Min', mon:'Sen', tue:'Sel', wed:'Rab', thu:'Kam', fri:'Jum', sat:'Sab' }
export const ALL_DAYS = ['mon','tue','wed','thu','fri','sat','sun']

export function formatDays(days) {
  if (days === 'daily') return 'Setiap Hari'
  if (days === 'weekdays') return 'Senin–Jumat'
  if (days === 'weekends') return 'Sabtu–Minggu'
  if (Array.isArray(days)) return days.map(d => DAY_LABELS[d]).join(', ')
  return '-'
}

// ─── Deteksi apakah running di dalam Capacitor native app ───────────────────
export function isNative() {
  return typeof window !== 'undefined' && !!(window.Capacitor?.isNativePlatform?.())
}

// ─── Minta izin notifikasi (native Capacitor atau web browser) ──────────────
export async function requestNotifPermission() {
  // Native Capacitor: minta izin via plugin
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.requestPermissions()
      return perm.display === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'unsupported'
    }
  }
  // Web browser fallback
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

// ─── Schedule semua reminder ke Capacitor Local Notifications (native) ──────
// Ini yang membuat notifikasi muncul WALAU APP DITUTUP
export async function scheduleAllNativeReminders(reminders) {
  if (!isNative()) return false
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    // Hapus semua notif terjadwal sebelumnya
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }

    const notifications = []
    let id = 1

    for (const reminder of reminders) {
      if (!reminder.enabled) continue

      const [hour, minute] = reminder.time.split(':').map(Number)

      // Tentukan hari-hari yang perlu di-schedule
      const days = reminder.days === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : reminder.days === 'weekdays'
        ? [1, 2, 3, 4, 5]
        : reminder.days === 'weekends'
        ? [0, 6]
        : Array.isArray(reminder.days)
        ? reminder.days.map(d => DAYS_SHORT.indexOf(d))
        : [0, 1, 2, 3, 4, 5, 6]

      // Buat notifikasi untuk tiap hari (1 minggu ke depan = 7 hari)
      for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
        const date = new Date()
        date.setDate(date.getDate() + dayOffset)
        const dayOfWeek = date.getDay()

        if (!days.includes(dayOfWeek)) continue

        date.setHours(hour, minute, 0, 0)
        if (date <= new Date()) continue // skip waktu yang sudah lewat

        notifications.push({
          id: id++,
          title: `🍽️ ${reminder.label}`,
          body: `Waktunya ${reminder.label}! Jangan lupa catat makananmu.`,
          schedule: { at: date, allowWhileIdle: true },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#22c55e',
          extra: { reminderId: reminder.id, mealType: reminder.mealType },
        })
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }

    return true
  } catch (e) {
    console.warn('Capacitor LocalNotifications failed:', e)
    return false
  }
}

// ─── Kirim notifikasi via Service Worker (web browser fallback) ─────────────
export function swNotify(title, body, tag, snoozeMinutes = 5) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { title, body, tag, snoozeMinutes },
    })
  }
}

// ─── Register Service Worker (web fallback) ──────────────────────────────────
export async function registerSW() {
  if (isNative()) return // Capacitor tidak butuh SW
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (e) {
    console.warn('SW register failed:', e)
  }
}
