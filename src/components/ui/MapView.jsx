import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-rotate' // patches L.Map with rotate/touchRotate options (no-op unless enabled)
import { Sun, Moon, LocateFixed } from 'lucide-react'
import ErrorBoundary from '../ErrorBoundary'
import { useMapTheme } from '../../hooks/useMapTheme'
import { useDeviceHeading } from '../../hooks/useDeviceHeading'

// CartoDB basemaps — dark for low light, light (Positron) for bright sunlight.
const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

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

// `heading` (degrees, 0 = North) draws an iPhone-style direction cone behind
// the dot. Pass null to show just the pulsing dot (no compass available).
function makeUserIcon(heading = null) {
  const cone = heading != null
    ? `<div class="gps-cone" style="transform: translate(-50%, -50%) rotate(${heading}deg)"></div>`
    : ''
  return L.divIcon({
    html: `<div class="gps-marker">${cone}<div class="gps-dot-outer"><div class="gps-dot-inner"></div></div></div>`,
    className: '',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
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
function MapController({ fitPositions }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (!mapIsAlive(map)) return

    try {
      map.invalidateSize()
      if (!fitted.current && fitPositions.length > 0) {
        fitted.current = true
        if (fitPositions.length === 1) {
          map.setView(fitPositions[0], 15, { animate: false })
        } else {
          map.fitBounds(L.latLngBounds(fitPositions), { padding: [28, 28], maxZoom: 16, animate: false })
        }
      }
    } catch (err) {
      console.warn('[MapView] map setup failed, using fallback view', err)
      try {
        if (mapIsAlive(map) && fitPositions.length > 0) map.setView(fitPositions[0], 14, { animate: false })
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
        height, width: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '6px',
        background: '#0b2447', color: 'rgba(226,232,240,0.7)',
        fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif',
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
 *   interactive     — allow drag/zoom + pinch-rotate (default false)
 *   accentColor     — hex color for route line + unlocked markers
 *   singleMode      — show single emoji pin instead of numbered markers
 *   userPosition    — { lat, lng } | null — live GPS dot
 *   extraFitPoints  — [[lat,lng], ...] — extra points to include when framing the map
 *                     (e.g. the user position, so a single-stop leg map frames both)
 *   showThemeToggle — render the light/dark toggle button (defaults to `interactive`)
 */
export default function MapView({
  missions,
  missionProgress,
  height = 180,
  interactive = false,
  accentColor = '#38bdf8',
  singleMode = false,
  userPosition = null,
  extraFitPoints = null,
  showThemeToggle,
}) {
  const { theme, toggle } = useMapTheme()
  const { heading, requestHeading } = useDeviceHeading()
  const mapRef = useRef(null)

  function recenterOnUser() {
    requestHeading() // iOS needs a gesture to grant compass access
    const map = mapRef.current
    if (map && mapIsAlive(map) && userLatLng) {
      try { map.setView(userLatLng, Math.max(map.getZoom() ?? 16, 16), { animate: true }) } catch (_) {}
    }
  }

  // Defensively normalize every input — bad data is the most common crash source.
  const valid = Array.isArray(missions)
    ? missions.filter(m => m && isValidLatLng(Number(m.coordinates?.lat), Number(m.coordinates?.lng)))
    : []
  if (valid.length === 0) return null

  const positions = valid.map(m => [Number(m.coordinates.lat), Number(m.coordinates.lng)])

  const userLatLng = userPosition ? toLatLng(userPosition.lat, userPosition.lng) : null

  const safeExtra = Array.isArray(extraFitPoints)
    ? extraFitPoints.map(p => (Array.isArray(p) ? toLatLng(p[0], p[1]) : null)).filter(Boolean)
    : []

  // Frame the map around the stops plus any extra points (e.g. the user).
  const fitPositions = [...positions, ...safeExtra]

  const enableToggle = showThemeToggle ?? interactive

  return (
    <div style={{ position: 'relative', height, width: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
      <ErrorBoundary label="MapView" fallback={<MapFallback height={height} />}>
        <MapContainer
          ref={mapRef}
          center={fitPositions[0]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={interactive}
          dragging={interactive}
          scrollWheelZoom={false}
          touchZoom={interactive}
          doubleClickZoom={false}
          keyboard={false}
          attributionControl={false}
          zoomAnimation={false}
          markerZoomAnimation={false}
          rotate={interactive}
          touchRotate={interactive}
          rotateControl={false}
          bearing={0}
        >
          {/* key forces a clean layer swap when the theme flips */}
          <TileLayer key={theme} url={TILE_URLS[theme] ?? TILE_URLS.dark} />
          <MapController fitPositions={fitPositions} />

          {/* Stop markers */}
          {valid.map((mission, idx) => {
            const status = missionProgress
              ? (missionProgress[mission.id]?.status ?? 'locked')
              : 'unlocked'

            let bg
            if (singleMode) bg = accentColor
            else if (status === 'completed') bg = '#22c55e'
            else if (status === 'unlocked') bg = accentColor
            else bg = '#374151'

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

          {/* Live GPS dot + heading cone */}
          {userLatLng && <Marker position={userLatLng} icon={makeUserIcon(heading)} />}
        </MapContainer>

        {/* Recenter on my location */}
        {interactive && userLatLng && (
          <button
            onClick={recenterOnUser}
            aria-label="Center on my location"
            style={{
              position: 'absolute', right: '8px', bottom: '8px', zIndex: 500,
              width: '34px', height: '34px', borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              background: theme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <LocateFixed className="w-4 h-4" style={{ color: theme === 'dark' ? '#0f172a' : '#f8fafc' }} />
          </button>
        )}

        {/* Light/dark toggle */}
        {enableToggle && (
          <button
            onClick={toggle}
            aria-label="Toggle map brightness"
            style={{
              position: 'absolute', left: '8px', bottom: '8px', zIndex: 500,
              width: '34px', height: '34px', borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              background: theme === 'dark' ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.85)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" style={{ color: '#0f172a' }} />
              : <Moon className="w-4 h-4" style={{ color: '#f8fafc' }} />}
          </button>
        )}
      </ErrorBoundary>
    </div>
  )
}
