import { useState, useEffect, useCallback, useRef } from 'react'

// Reads the device's compass heading (0 = North, clockwise) so the map can draw
// an iPhone-style "looking direction" cone on the user's GPS dot.
//
// - iOS exposes a true compass heading via `event.webkitCompassHeading` and
//   requires an explicit permission grant from a user gesture (requestHeading).
// - Android / desktop fire `deviceorientationabsolute` (or `deviceorientation`)
//   with `alpha`, which is counter-clockwise, so heading = 360 - alpha. No
//   permission prompt there — we attach the listener on mount.
export function useDeviceHeading() {
  const [heading, setHeading] = useState(null)
  const attached = useRef(false)

  const handle = useCallback((e) => {
    let h = null
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      h = e.webkitCompassHeading // iOS: already 0=N, clockwise
    } else if (typeof e.alpha === 'number' && e.alpha != null) {
      h = 360 - e.alpha
    }
    if (h == null || Number.isNaN(h)) return
    // Quantise to 2° to limit re-renders from the high-frequency sensor stream.
    const q = (Math.round(h / 2) * 2) % 360
    setHeading(prev => (prev === q ? prev : q))
  }, [])

  const attach = useCallback(() => {
    if (attached.current) return
    attached.current = true
    window.addEventListener('deviceorientationabsolute', handle, true)
    window.addEventListener('deviceorientation', handle, true)
  }, [handle])

  // Call from a user gesture (e.g. the locate button) — needed for iOS 13+.
  const requestHeading = useCallback(() => {
    const DOE = typeof window !== 'undefined' ? window.DeviceOrientationEvent : undefined
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(state => { if (state === 'granted') attach() }).catch(() => {})
    } else {
      attach()
    }
  }, [attach])

  useEffect(() => {
    const DOE = typeof window !== 'undefined' ? window.DeviceOrientationEvent : undefined
    const needsPermission = DOE && typeof DOE.requestPermission === 'function'
    // Where no explicit permission is required, start listening immediately.
    if (!needsPermission) attach()
    return () => {
      window.removeEventListener('deviceorientationabsolute', handle, true)
      window.removeEventListener('deviceorientation', handle, true)
    }
  }, [attach, handle])

  return { heading, requestHeading }
}
