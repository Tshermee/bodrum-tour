import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

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

// Child component — must be inside MapContainer to call useMap()
function MapController({ positions, interactive }) {
  const map = useMap()
  useEffect(() => {
    const fit = () => {
      if (positions.length === 0) return
      if (positions.length === 1) {
        map.setView(positions[0], 15)
      } else {
        try {
          map.fitBounds(L.latLngBounds(positions), { padding: [24, 24], maxZoom: 15 })
        } catch (_) {
          map.setView(positions[0], 14)
        }
      }
    }
    // Invalidate first so tiles render in dynamic containers (scrollable cards)
    const t = setTimeout(() => { map.invalidateSize(); fit() }, 80)
    return () => clearTimeout(t)
  }, [map, positions, interactive])
  return null
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
 *   singleMode      — show single emoji pin instead of numbered markers (for mission detail)
 */
export default function MapView({
  missions,
  missionProgress,
  height = 180,
  interactive = false,
  accentColor = '#38bdf8',
  singleMode = false,
}) {
  const valid = missions.filter(m => m.coordinates?.lat && m.coordinates?.lng)
  if (valid.length === 0) return null

  const positions = valid.map(m => [m.coordinates.lat, m.coordinates.lng])

  return (
    <div style={{ height, width: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
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
        <MapController positions={positions} interactive={interactive} />

        {/* Route line */}
        {valid.length > 1 && (
          <Polyline
            positions={positions}
            color={accentColor}
            weight={2.5}
            dashArray="7 5"
            opacity={0.85}
          />
        )}

        {/* Markers */}
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
              position={[mission.coordinates.lat, mission.coordinates.lng]}
              icon={makeIcon(label, bg, size)}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
