/**
 * FloatingIsland — Capacitor 8 native plugin wrapper
 */
import { registerPlugin } from '@capacitor/core'

const FI = registerPlugin('FloatingIsland')

export async function checkOverlayPermission() {
  try { const r = await FI.checkPermission(); return r?.granted === true }
  catch { return false }
}

export async function requestOverlayPermission() {
  try { await FI.requestPermission() }
  catch {
    alert('Aktifkan manual:\nPengaturan → Aplikasi → BulkMate → Tampilkan di atas app lain → Aktifkan')
  }
}

/** Langsung tampilkan overlay (test / saat alarm in-app) */
export async function showFloatingIsland(label, color) {
  try { await FI.show({ label: label || 'Pengingat', color: color || '#22c55e' }) }
  catch (e) { console.warn('FloatingIsland.show failed:', e) }
}

/** Sembunyikan overlay */
export async function hideFloatingIsland() {
  try { await FI.hide() } catch {}
}

export async function saveFloatingCameraPosition(offsetX, offsetY) {
  try { await FI.saveCameraPosition({ offsetX: offsetX || 0, offsetY: offsetY || 8 }) }
  catch {}
}

export async function scheduleFloatingIslands(reminders) {
  try {
    await FI.scheduleAll({ remindersJson: JSON.stringify(reminders) })
    return true
  } catch (e) { console.warn('FloatingIsland.scheduleAll failed:', e); return false }
}

export async function cancelFloatingIslands() {
  try { await FI.cancelAll() } catch {}
}
