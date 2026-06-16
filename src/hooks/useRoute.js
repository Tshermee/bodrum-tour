import { useState, useEffect } from 'react'

// Fetches a real walking route from the free OSRM demo server.
// Debounces 1.5 s to absorb GPS jitter — only fires after position settles.
export function useRoute(from, to) {
  const [routePoints, setRoutePoints] = useState(null)

  useEffect(() => {
    if (!from || !to) {
      setRoutePoints(null)
      return
    }

    const controller = new AbortController()
    // OSRM expects lng,lat order (opposite of Leaflet's [lat,lng])
    const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`

    const t = setTimeout(async () => {
      try {
        const res = await fetch(url, { signal: controller.signal })
        const data = await res.json()
        if (data.routes?.[0]?.geometry?.coordinates) {
          // Flip [lng, lat] → [lat, lng] for Leaflet
          setRoutePoints(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]))
        }
      } catch {
        // Silently fall back to straight-line (set in parent)
      }
    }, 1500)

    return () => { clearTimeout(t); controller.abort() }
  }, [from?.lat, from?.lng, to?.lat, to?.lng])

  return { routePoints }
}
