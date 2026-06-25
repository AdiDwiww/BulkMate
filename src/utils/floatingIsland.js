/**
 * FloatingIsland JS wrapper
 * Calls native FloatingIslandPlugin via Capacitor bridge directly.
 */

/** Call a native FloatingIsland plugin method directly via bridge */
async function callNative(method, args = {}) {
  try {
    if (!window?.Capacitor?.isNativePlatform?.()) return null
    return await window.Capacitor.nativePromise('FloatingIsland', method, args)
  } catch (e) {
    console.warn(`FloatingIsland.${method} failed:`, e)
    return null
  }
}

/** Check if "Draw over other apps" permission is granted */
export async function checkOverlayPermission() {
  const r = await callNative('checkPermission')
  return r?.granted === true
}

/** Open Android Settings to grant overlay permission */
export async function requestOverlayPermission() {
  const r = await callNative('requestPermission')
  // If native call didn't work, show manual instructions
  if (!r) showManualInstructions()
}

function showManualInstructions() {
  alert(
    'Aktifkan manual:\n' +
    'Pengaturan → Aplikasi → BulkMate → ' +
    'Tampilkan di atas app lain → Aktifkan'
  )
}

/** Save camera position to SharedPreferences (used when app is closed) */
export async function saveFloatingCameraPosition(offsetX, offsetY) {
  await callNative('saveCameraPosition', {
    offsetX: offsetX || 0,
    offsetY: offsetY || 8,
  })
}

/** Schedule all floating island alarms via native AlarmManager */
export async function scheduleFloatingIslands(reminders) {
  const r = await callNative('scheduleAll', { reminders })
  return r !== null
}

/** Cancel all scheduled floating island alarms */
export async function cancelFloatingIslands() {
  await callNative('cancelAll')
}
