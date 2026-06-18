import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import ErrorBoundary from '../ErrorBoundary'

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// A valid lat/lng must be a finite number in range. Note: 0 is valid
// (equator / prime meridian), so never rely on truthiness for coordinates.
function isValidLatLng(lat, lng) {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  )
}

// Coerce a [lat, lng] pair from loose input; returns null if invalid.
function toLatLng(lat, lng) {
  const a = Number(lat)
  const b = Number(lng)
  return isValidLatLng(a, b) ? [a, b] : null
}

function makeIcon(label, bgColor, size = 28) {
  const fs = size <= 24 ? 10 : 12
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bgColor};color:#fff;
      font-size:${fs}px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border:2px solid rgba(255,255,255,0.5);
      box-shadow:0 2px 8px rgba(0,0,0,0.7);
      font-family:Inter,system-ui,sans-serif;
      user-select:none;pointer-events:none;
    ">${label}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function makeUserIcon() {
  return L.divIcon({
    html: `<div class="gps-dot-outer"><div class="gps-dot-inner"></div></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Returns true while the map's container is still attached to the DOM and the
// internal panes exist. Leaflet methods that read pixel positions crash with
// "Cannot read properties of undefined (reading '_leaflet_pos')" once React has
// detached the container, so we gate every map call on this.
function mapIsAlive(map) {
  try {
    const c = map?.getContainer?.()
    return !!c && c.isConnected && !!map._mapPane
  } catch (_) {
    return false
  }
}

// Fits bounds once on mount, stops any animation on unmount to prevent
// Leaflet's _leaflet_pos crash when the container is removed mid-animation.
function MapController({ positions }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (!mapIsAlive(map)) return

    try {
      map.invalidateSize()
      if (!fitted.current && positions.length > 0) {
        fitted.current = true
        if (positions.length === 1) {
          map.setView(positions[0], 15)
        } else {
          map.fitBounds(L.latLngBounds(positions), { padding: [28, 28], maxZoom: 15 })
        }
      }
    } catch (err) {
      // A bad fitBounds / invalidateSize should never crash the app — fall back
      // to a plain centered view and move on.
      console.warn('[MapView] map setup failed, using fallback view', err)
      try {
        if (mapIsAlive(map) && positions.length > 0) map.setView(positions[0], 14)
      } catch (_) {}
    }

    return () => {
      try {
        if (mapIsAlive(map)) map.stop()
      } catch (_) {}
    }
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// Small inline placeholder shown if the Leaflet subtree throws during render.
function MapFallback({ height }) {
  return (
    <div
      style={{
        height,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: '#0b2447',
        color: 'rgba(226,232,240,0.7)',
        fontSize: '13px',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: 'inherit',
      }}
    >
      <span style={{ fontSize: '22px' }}>🗺️</span>
      <span>Map unavailable</span>
    </div>
  )
}

/**
 * MapView — reusable Leaflet map.
 *
 * Props:
 *   missions        — array of mission objects (must have .coordinates {lat,lng})
 *   missionProgress — object keyed by mission.id → {status} (optional, for color-coding)
 *   height          — CSS height in px (default 180)
 *   interactive     — allow drag/zoom (default false)
 *   accentColor     — hex color for route line + unlocked markers
 *   singleMode      — show single emoji pin instead of numbered markers
 *   userPosition    — { lat, lng } | null — live GPS dot
 *   routePoints     — [[lat,lng], ...] | null — walking route polyline (e.g. from OSRM)
 */
export default function MapView({
  missions,
  missionProgress,
  height = 180,
  interactive = false,
  accentColor = '#38bdf8',
  singleMode = false,
  userPosition = null,
  routePoints = null,
}) {
  // Defensively normalize every input — bad data is the most common crash source.
  const valid = Array.isArray(missions)
    ? missions.filter(m => m && isValidLatLng(Number(m.coordinates?.lat), Number(m.coordinates?.lng)))
    : []
  if (valid.length === 0) return null

  const positions = valid.map(m => [Number(m.coordinates.lat), Number(m.coordinates.lng)])

  // Only keep route points that are valid coordinate pairs.
  const safeRoute = Array.isArray(routePoints)
    ? routePoints
        .map(p => (Array.isArray(p) ? toLatLng(p[0], p[1]) : null))
        .filter(Boolean)
    : null

  const userLatLng = userPosition
    ? toLatLng(userPosition.lat, userPosition.lng)
    : null

  return (
    <div style={{ height, width: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
      <ErrorBoundary label="MapView" fallback={<MapFallback height={height} />}>
        <MapContainer
          center={positions[0]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={interactive}
          dragging={interactive}
          scrollWheelZoom={false}
          touchZoom={interactive}
          doubleClickZoom={false}
          keyboard={false}
          attributionControl={false}
        >
          <TileLayer url={TILE_URL} />
          <MapController positions={positions} />

          {/* Stop-to-stop route line */}
          {valid.length > 1 && (
            <Polyline
              positions={positions}
              color={accentColor}
              weight={2.5}
              dashArray="7 5"
              opacity={0.6}
            />
          )}

          {/* Walking route (OSRM geometry or straight-line fallback) */}
          {safeRoute && safeRoute.length > 1 && (
            <Polyline
              positions={safeRoute}
              color="#3b82f6"
              weight={3.5}
              opacity={0.9}
            />
          )}

          {/* Stop markers */}
          {valid.map((mission, idx) => {
            const status = missionProgress
              ? (missionProgress[mission.id]?.status ?? 'locked')
              : 'unlocked'

            let bg
            if (singleMode) {
              bg = accentColor
            } else if (status === 'completed') {
              bg = '#22c55e'
            } else if (status === 'unlocked') {
              bg = accentColor
            } else {
              bg = '#374151'
            }

            const label = singleMode ? mission.emoji ?? '📍' : String(idx + 1)
            const size = singleMode ? 36 : 26

            return (
              <Marker
                key={mission.id}
                position={[Number(mission.coordinates.lat), Number(mission.coordinates.lng)]}
                icon={makeIcon(label, bg, size)}
              />
            )
          })}

          {/* Live GPS dot */}
          {userLatLng && (
            <Marker
              position={userLatLng}
              icon={makeUserIcon()}
            />
          )}
        </MapContainer>
      </ErrorBoundary>
    </div>
  )
}
