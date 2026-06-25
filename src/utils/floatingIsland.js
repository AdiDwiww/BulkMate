/**
 * FloatingIsland JS wrapper
 * Calls native FloatingIslandPlugin via Capacitor bridge.
 * Falls back silently on web/browser.
 */

async function getPlugin() {
  if (typeof window === 'undefined') return null
  if (!window.Capacitor?.isNativePlatform?.()) return null
  try {
    const { registerPlugin } = await import('@capacitor/core')
    return registerPlugin('FloatingIsland')
  } catch {
    return null
  }
}

/** Check if "Draw over other apps" permission is granted */
export async function checkOverlayPermission() {
  const p = await getPlugin()
  if (!p) return false
  try {
    const r = await p.checkPermission()
    return r.granted === true
  } catch { return false }
}

/** Open Android Settings to grant overlay permission */
export async function requestOverlayPermission() {
  const p = await getPlugin()
  if (p) {
    try {
      const result = await p.requestPermission()
      // If plugin couldn't open settings, show manual instructions
      if (result?.error) {
        showManualInstructions()
      }
      return
    } catch (e) {
      console.warn('FloatingIsland.requestPermission error:', e)
    }
  }
  // Fallback: manual instructions
  showManualInstructions()
}

function showManualInstructions() {
  alert(
    'Buka manual:\n' +
    'Pengaturan → Aplikasi → BulkMate → ' +
    'Tampilkan di atas app lain → Aktifkan'
  )
}

/** Save camera position to SharedPreferences (for use when app is closed) */
export async function saveFloatingCameraPosition(offsetX, offsetY) {
  const p = await getPlugin()
  if (!p) return
  try { await p.saveCameraPosition({ offsetX: offsetX || 0, offsetY: offsetY || 8 }) } catch {}
}

/** Schedule all floating island alarms (calls native AlarmManager) */
export async function scheduleFloatingIslands(reminders) {
  const p = await getPlugin()
  if (!p) return false
  try {
    await p.scheduleAll({ reminders })
    return true
  } catch (e) {
    console.warn('FloatingIsland scheduleAll failed:', e)
    return false
  }
}

/** Cancel all scheduled floating island alarms */
export async function cancelFloatingIslands() {
  const p = await getPlugin()
  if (!p) return
  try { await p.cancelAll() } catch {}
}
