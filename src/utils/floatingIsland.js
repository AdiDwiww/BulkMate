/**
 * FloatingIsland — native overlay wrapper
 * Uses Capacitor.Plugins directly (works for manually registered plugins)
 */

function getPlugin() {
  try {
    if (!window?.Capacitor?.isNativePlatform?.()) return null
    // Capacitor makes registered plugins available on window.Capacitor.Plugins
    const p = window.Capacitor?.Plugins?.FloatingIsland
    return p || null
  } catch { return null }
}

export async function checkOverlayPermission() {
  const p = getPlugin()
  if (!p) return false
  try {
    const r = await p.checkPermission()
    return r?.granted === true
  } catch { return false }
}

export async function requestOverlayPermission() {
  const p = getPlugin()
  if (!p) {
    alert('Aktifkan manual:\nPengaturan → Aplikasi → BulkMate → Tampilkan di atas app lain → Aktifkan')
    return
  }
  try {
    await p.requestPermission()
  } catch {
    alert('Aktifkan manual:\nPengaturan → Aplikasi → BulkMate → Tampilkan di atas app lain → Aktifkan')
  }
}

/** Tampilkan overlay langsung (test/debug) */
export async function showFloatingIsland(label, color) {
  const p = getPlugin()
  if (!p) return
  try { await p.show({ label: label || 'Pengingat', color: color || '#22c55e' }) }
  catch (e) { console.warn('FloatingIsland.show failed:', e) }
}

export async function hideFloatingIsland() {
  const p = getPlugin()
  if (!p) return
  try { await p.hide() } catch {}
}

export async function saveFloatingCameraPosition(offsetX, offsetY) {
  const p = getPlugin()
  if (!p) return
  try { await p.saveCameraPosition({ offsetX: offsetX || 0, offsetY: offsetY || 8 }) }
  catch {}
}

export async function scheduleFloatingIslands(reminders) {
  const p = getPlugin()
  if (!p) return false
  try {
    await p.scheduleAll({ remindersJson: JSON.stringify(reminders) })
    return true
  } catch (e) {
    console.warn('FloatingIsland.scheduleAll failed:', e)
    return false
  }
}

export async function cancelFloatingIslands() {
  const p = getPlugin()
  if (!p) return
  try { await p.cancelAll() } catch {}
}
