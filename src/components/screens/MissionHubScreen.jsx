import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Star, Lock, CheckCircle2, ChevronRight, RotateCcw,
  Trophy, Zap, ArrowLeft, MapPin, Navigation2, Maximize2, X, SkipForward,
} from 'lucide-react'
import MapView from '../ui/MapView'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useRoute } from '../../hooks/useRoute'
import { getDistanceMeters, formatDistance } from '../../lib/geo'

const GPS_RADIUS = 50 // metres

function MissionCard({ mission, progress, index, onOpen, distance, gpsActive }) {
  const status = progress?.status ?? 'locked'
  const isLocked    = status === 'locked'
  const isCompleted = status === 'completed'
  const isSkipped   = isCompleted && !!progress?.skipped
  const isUnlocked  = status === 'unlocked'

  const isNearby = gpsActive && distance != null && distance <= GPS_RADIUS
  const isFar    = gpsActive && distance != null && distance >  GPS_RADIUS

  return (
    <button
      onClick={() => !isLocked && onOpen(mission.id)}
      disabled={isLocked}
      className={`
        w-full text-left rounded-2xl overflow-hidden transition-all duration-200
        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
        ${isUnlocked && !isNearby ? 'glow-cyan' : ''}
      `}
      style={isSkipped ? { opacity: 0.65 } : isUnlocked && isNearby ? {
        boxShadow: '0 0 20px rgba(34,197,94,0.4), 0 0 40px rgba(34,197,94,0.15)',
      } : undefined}
    >
      <div
        className="relative p-4 flex items-center gap-4"
        style={{
          background: isLocked
            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
            : isCompleted
              ? `linear-gradient(135deg, ${mission.gradient[0]}88, ${mission.gradient[1]}88)`
              : `linear-gradient(135deg, ${mission.gradient[0]}, ${mission.gradient[1]})`,
          border: isUnlocked && isNearby
            ? '1px solid rgba(34,197,94,0.5)'
            : isUnlocked
              ? `1px solid ${mission.accentColor}55`
              : isCompleted
                ? '1px solid rgba(34,197,94,0.25)'
                : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{
            background: isCompleted
              ? 'rgba(34,197,94,0.2)'
              : isLocked
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.15)',
            border: isCompleted
              ? '1px solid rgba(34,197,94,0.3)'
              : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {isSkipped
            ? <SkipForward className="w-5 h-5 text-amber-500/60" />
            : isCompleted
            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
            : isLocked
              ? <Lock className="w-4 h-4 text-white/30" />
              : <span className="text-white">{mission.emoji}</span>}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-white/40 text-xs font-semibold tracking-wider">STOP {index + 1}</span>
            {isUnlocked && isNearby && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                HERE ✓
              </span>
            )}
            {isUnlocked && !isNearby && !isFar && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${mission.accentColor}22`, color: mission.accentColor }}
              >
                NOW
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-sm truncate">{mission.title}</div>
          <div className="text-white/50 text-xs truncate mt-0.5">
            {isUnlocked && isFar
              ? `Walk ${formatDistance(distance)} to unlock`
              : mission.location}
          </div>
        </div>

        {/* Right */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isSkipped ? (
            <span className="text-amber-500/60 text-xs font-medium">skipped</span>
          ) : isCompleted ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 text-sm font-bold">{progress.score}</span>
            </div>
          ) : isUnlocked && isNearby ? (
            <ChevronRight className="w-5 h-5 text-green-400" />
          ) : isUnlocked && isFar ? (
            <Navigation2 className="w-4 h-4 text-amber-400" />
          ) : isUnlocked ? (
            <ChevronRight className="w-5 h-5" style={{ color: mission.accentColor }} />
          ) : (
            <span className="text-white/20 text-xs font-medium">{mission.points}pts</span>
          )}
        </div>
      </div>
    </button>
  )
}

export default function MissionHubScreen({ tour, tourProgress, teamName, onOpenMission, onBackToSelect, onResetTour }) {
  const [showReset, setShowReset] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [toast, setToast] = useState(null)
  const prevNearby = useRef(new Set())

  const { position: userPos } = useGeolocation()

  const missions = tour.missions
  const completed = missions.filter(m => tourProgress.missions[m.id]?.status === 'completed').length
  const progressPct = Math.round((completed / missions.length) * 100)
  const nextMission = missions.find(m => tourProgress.missions[m.id]?.status === 'unlocked')

  // Distance from user to every stop (metres)
  const distances = useMemo(() => {
    if (!userPos) return {}
    return missions.reduce((acc, m) => {
      if (m.coordinates) {
        acc[m.id] = getDistanceMeters(userPos.lat, userPos.lng, m.coordinates.lat, m.coordinates.lng)
      }
      return acc
    }, {})
  }, [userPos, missions])

  const gpsActive = userPos !== null

  // Fire toast when user enters the 50m radius of an unlocked stop
  useEffect(() => {
    if (!userPos) return
    missions.forEach(m => {
      if (tourProgress.missions[m.id]?.status !== 'unlocked') return
      const dist = distances[m.id]
      if (dist == null) return
      const nearby = dist <= GPS_RADIUS
      if (nearby && !prevNearby.current.has(m.id)) {
        setToast({ text: `You've arrived at ${m.title}! Tap to start.`, type: 'arrive' })
        prevNearby.current.add(m.id)
      } else if (!nearby) {
        prevNearby.current.delete(m.id)
      }
    })
  }, [distances, missions, tourProgress, userPos])

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  function handleOpenMission(missionId) {
    const mission = missions.find(m => m.id === missionId)
    const status = tourProgress.missions[missionId]?.status
    if (status !== 'unlocked') return

    // GPS gate — only active when we have a live position AND the stop has coordinates
    if (gpsActive && mission.coordinates) {
      const dist = distances[missionId] ?? Infinity
      if (dist > GPS_RADIUS) {
        setToast({ text: `Walk closer — you're ${formatDistance(dist)} away`, type: 'warn' })
        return
      }
    }
    onOpenMission(missionId)
  }

  // OSRM walking route: user → next unlocked stop
  const routeTo = (gpsActive && nextMission?.coordinates) ? nextMission.coordinates : null
  const { routePoints: osrmRoute } = useRoute(userPos, routeTo)
  // While OSRM loads, show a straight dashed line as fallback
  const routePoints = osrmRoute
    ?? (userPos && routeTo ? [[userPos.lat, userPos.lng], [routeTo.lat, routeTo.lng]] : null)

  const nextDist = nextMission ? distances[nextMission.id] : null

  return (
    <div className="flex flex-col min-h-screen screen-enter-up">

      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className="relative pt-safe px-5 pb-5 flex-shrink-0"
        style={{ background: `linear-gradient(180deg, ${tour.gradient[0]} 0%, ${tour.gradient[1]}cc 100%)` }}
      >
        <div className="flex items-center justify-between mb-4 pt-2">
          <button
            onClick={onBackToSelect}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white/80 text-xs font-medium">Tours</span>
          </button>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">{tourProgress.totalScore}</span>
            </div>
            <button
              onClick={() => setShowReset(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <RotateCcw className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-0.5">{teamName}</div>
          <h1 className="text-white font-bold text-xl leading-tight">{tour.title}</h1>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/50 text-xs">
              {completed} of {missions.length} stops completed
            </span>
            <span className="text-xs font-semibold" style={{ color: tour.accentColor }}>
              {progressPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${tour.accentColor}cc, ${tour.accentColor})`,
                boxShadow: `0 0 8px ${tour.accentColor}66`,
              }}
            />
          </div>
        </div>

        {/* Up next callout */}
        {nextMission && (
          <button
            onClick={() => handleOpenMission(nextMission.id)}
            className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
            style={{
              background: `linear-gradient(135deg, ${nextMission.gradient[0]}cc, ${nextMission.gradient[1]}cc)`,
              border: `1px solid ${nextMission.accentColor}44`,
              boxShadow: `0 4px 16px ${nextMission.accentColor}22`,
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-white/60 text-xs">Up next</div>
              <div className="text-white font-semibold text-sm">{nextMission.title}</div>
            </div>
            {gpsActive && nextDist != null ? (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                nextDist <= GPS_RADIUS
                  ? 'bg-green-500/25 text-green-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {nextDist <= GPS_RADIUS ? 'Nearby ✓' : formatDistance(nextDist)}
              </span>
            ) : (
              <ChevronRight className="w-5 h-5 text-white/60" />
            )}
          </button>
        )}
      </div>

      {/* ── GPS Live Map ────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-4 mt-3">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Map + expand button */}
          <div className="relative">
            <MapView
              missions={missions}
              missionProgress={tourProgress.missions}
              height={190}
              interactive={true}
              accentColor={tour.accentColor}
              userPosition={userPos}
              routePoints={routePoints}
            />
            <button
              onClick={() => setFullscreen(true)}
              className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.55)', zIndex: 400 }}
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          </div>
          {/* GPS status bar */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ background: 'rgba(6,15,30,0.85)' }}
          >
            {gpsActive ? (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                <span className="text-white/50 text-xs">Live location active</span>
                {nextMission?.coordinates && nextDist != null && (
                  <span
                    className="ml-auto text-xs font-semibold"
                    style={{ color: nextDist <= GPS_RADIUS ? '#4ade80' : tour.accentColor }}
                  >
                    Next stop: {nextDist <= GPS_RADIUS ? 'Nearby ✓' : formatDistance(nextDist)}
                  </span>
                )}
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3 text-white/25 flex-shrink-0" />
                <span className="text-white/25 text-xs">Enable GPS for live tracking & stop unlocks</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast notification ──────────────────────────────── */}
      {toast && (
        <div
          className="mx-4 mt-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-center"
          style={toast.type === 'arrive'
            ? { background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)', color: '#86efac' }
            : { background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)', color: '#fcd34d' }}
        >
          {toast.text}
        </div>
      )}

      {/* ── Mission list ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-safe">
        <div className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-3 px-1">
          All Stops
        </div>
        <div className="flex flex-col gap-2.5 stagger-children">
          {missions.map((mission, idx) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              progress={tourProgress.missions[mission.id]}
              index={idx}
              onOpen={handleOpenMission}
              distance={distances[mission.id]}
              gpsActive={gpsActive}
            />
          ))}
        </div>

        <div className="mt-4 px-1 text-center">
          <p className="text-white/20 text-xs">
            {tour.title} · {tour.totalPossibleScore} pts possible
          </p>
        </div>
      </div>

      {/* ── Fullscreen map portal ───────────────────────────── */}
      {fullscreen && createPortal(
        <div className="fixed inset-0 flex flex-col" style={{ zIndex: 9999, background: '#050e1a' }}>
          {/* Full-height map */}
          <div className="relative flex-1" style={{ minHeight: 0 }}>
            <MapView
              missions={missions}
              missionProgress={tourProgress.missions}
              height={window.innerHeight - (nextMission ? 72 : 0)}
              interactive={true}
              accentColor={tour.accentColor}
              userPosition={userPos}
              routePoints={routePoints}
            />
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Tour label */}
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-xl text-white text-xs font-semibold"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
            >
              {tour.title}
            </div>
          </div>

          {/* Bottom bar: next stop info + distance */}
          {nextMission && (
            <div
              className="flex items-center gap-3 px-4 py-4"
              style={{ background: 'rgba(6,15,30,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              {gpsActive && (
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white/50 text-xs">Next stop</div>
                <div className="text-white font-semibold text-sm truncate">{nextMission.title}</div>
              </div>
              {gpsActive && nextDist != null ? (
                <span
                  className="text-sm font-bold px-3 py-1.5 rounded-full"
                  style={nextDist <= GPS_RADIUS
                    ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80' }
                    : { background: 'rgba(251,191,36,0.15)', color: '#fcd34d' }}
                >
                  {nextDist <= GPS_RADIUS ? 'Nearby ✓' : formatDistance(nextDist)}
                </span>
              ) : null}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ── Reset confirmation ──────────────────────────────── */}
      {showReset && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowReset(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl p-6 pb-safe animate-slide-up"
            style={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-2">Restart this tour?</h3>
            <p className="text-white/50 text-sm mb-6">
              Progress for <span className="text-white font-medium">{tour.title}</span> will be reset.
              Your earned lifetime points are kept.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowReset(false); onResetTour() }}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
              >
                Reset Tour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
