/**
 * FloatingIsland — Capacitor 8 native plugin wrapper
 * Uses registerPlugin at module level (required for Capacitor 6+)
 */
import { registerPlugin } from '@capacitor/core'

// Register at module level — WAJIB di Capacitor 8
const FloatingIslandPlugin = registerPlugin('FloatingIsland', {
  // Web stub — fungsi kosong agar tidak throw di browser
  web: () => Promise.resolve({
    checkPermission:    () => Promise.resolve({ granted: false }),
    requestPermission:  () => Promise.resolve({}),
    saveCameraPosition: () => Promise.resolve({}),
    scheduleAll:        () => Promise.resolve({}),
    cancelAll:          () => Promise.resolve({}),
  }),
})

export async function checkOverlayPermission() {
  try {
    const r = await FloatingIslandPlugin.checkPermission()
    return r?.granted === true
  } catch { return false }
}

export async function requestOverlayPermission() {
  try {
    await FloatingIslandPlugin.requestPermission()
  } catch {
    alert('Aktifkan manual:\nPengaturan → Aplikasi → BulkMate → Tampilkan di atas app lain → Aktifkan')
  }
}

export async function saveFloatingCameraPosition(offsetX, offsetY) {
  try {
    await FloatingIslandPlugin.saveCameraPosition({ offsetX: offsetX || 0, offsetY: offsetY || 8 })
  } catch {}
}

export async function scheduleFloatingIslands(reminders) {
  try {
    // Kirim sebagai JSON string karena array kadang tidak terserialize dengan benar
    await FloatingIslandPlugin.scheduleAll({ remindersJson: JSON.stringify(reminders) })
    return true
  } catch (e) {
    console.warn('scheduleFloatingIslands failed:', e)
    return false
  }
}

export async function cancelFloatingIslands() {
  try { await FloatingIslandPlugin.cancelAll() } catch {}
}
