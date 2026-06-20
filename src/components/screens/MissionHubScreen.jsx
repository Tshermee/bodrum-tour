import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  Star, Lock, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, RotateCcw,
  Trophy, ArrowLeft, MapPin, Navigation2, Maximize2, X, SkipForward,
} from 'lucide-react'
import MapView from '../ui/MapView'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getDistanceMeters, formatDistance } from '../../lib/geo'
import { fetchAppConfig } from '../../lib/api'

const GPS_RADIUS = 50    // metres — "you're here" arrival radius (badge + toast)
const REACH_RADIUS = 300 // metres — close enough to open & do a stop; matches MissionScreen's COMPLETE_RADIUS.
                         // GPS in town can drift 50–150 m, so gating opening at 50 m left players unable to
                         // start a stop they were standing at.

// Slim, "minimized" row for stops that are done or skipped — keeps the screen
// focused on directing the player to the next stop.
function CompactMissionCard({ mission, progress, index, onOpen }) {
  const { t } = useTranslation()
  const isSkipped = !!progress?.skipped
  return (
    <button
      onClick={() => onOpen(mission.id)}
      className="w-full text-left rounded-xl px-3 py-2 flex items-center gap-3 active:scale-[0.99] transition-transform"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', opacity: isSkipped ? 0.7 : 0.9 }}
    >
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: isSkipped ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.15)' }}
      >
        {isSkipped
          ? <SkipForward className="w-3.5 h-3.5 text-amber-500/70" />
          : <CheckCircle2 className="w-4 h-4 text-green-400" />}
      </div>
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="text-white/30 text-[10px] font-semibold tracking-wider flex-shrink-0">{index + 1}</span>
        <span className="text-white/70 text-sm truncate">{mission.title}</span>
      </div>
      {isSkipped ? (
        <span className="text-amber-500/60 text-xs font-medium flex-shrink-0">{t('hub_stop_skipped')}</span>
      ) : (
        <span className="flex items-center gap-1 flex-shrink-0">
          <Star className="w-3 h-3 text-amber-400/80 fill-amber-400/80" />
          <span className="text-amber-400/80 text-xs font-bold">{progress.score}</span>
        </span>
      )}
    </button>
  )
}

function MissionCard({ mission, progress, index, onOpen, distance, gpsActive, isTarget, hint }) {
  const { t } = useTranslation()
  const status = progress?.status ?? 'locked'
  const isLocked    = status === 'locked'
  const isCompleted = status === 'completed'
  const isSkipped   = isCompleted && !!progress?.skipped
  const isUnlocked  = status === 'unlocked'

  const isNearby = gpsActive && distance != null && distance <= GPS_RADIUS
  const isFar    = gpsActive && distance != null && distance >  GPS_RADIUS

  return (
    <button
      onClick={() => onOpen(mission.id)}
      className={`
        w-full text-left rounded-2xl overflow-hidden transition-all duration-200
        ${isLocked ? 'opacity-60' : 'active:scale-[0.98]'}
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
            <span className="text-white/40 text-xs font-semibold tracking-wider uppercase">{t('mission_stop')} {index + 1}</span>
            {isUnlocked && isNearby && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                {t('hub_here')}
              </span>
            )}
            {isUnlocked && !isNearby && isTarget && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${mission.accentColor}22`, color: mission.accentColor }}
              >
                {t('hub_next')}
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-sm truncate">{mission.title}</div>
          <div className="text-white/50 text-xs truncate mt-0.5">{mission.location}</div>
        </div>

        {/* Right */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isSkipped ? (
            <span className="text-amber-500/60 text-xs font-medium">{t('hub_stop_skipped')}</span>
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

      {/* Subtle reason it can't start yet (sequence-locked or too far) */}
      {hint && (
        <div className="flex items-center gap-1.5 px-4 py-2 animate-fade-in"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Lock className="w-3 h-3 text-amber-300/80 flex-shrink-0" />
          <span className="text-amber-200/90 text-xs">{hint}</span>
        </div>
      )}
    </button>
  )
}

export default function MissionHubScreen({ tour, tourProgress, teamName, onOpenMission, onBackToSelect, onResetTour }) {
  const { t, i18n } = useTranslation()
  const [showReset, setShowReset] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [blockedHint, setBlockedHint] = useState(null) // { id, message } — why a tapped stop can't start yet
  const [showRules, setShowRules] = useState(false)
  const [arrivedTarget, setArrivedTarget] = useState(false)
  const [rulesCfg, setRulesCfg] = useState(null)
  const [showDone, setShowDone] = useState(false)

  // Show rules the first time a user enters a new tour
  useEffect(() => {
    const key = `bodrum-rules-seen-${tour.id}`
    if (!localStorage.getItem(key)) {
      setShowRules(true)
    }
  }, [tour.id])

  // Admin-editable rules text (app_config key 'rules')
  useEffect(() => {
    fetchAppConfig('rules').then(setRulesCfg).catch(() => {})
  }, [])
  const rcfg = rulesCfg?.[(i18n.language || 'en').split('-')[0]] || rulesCfg?.en || {}

  const { position: userPos } = useGeolocation()

  const isFreeRoam = tour.tourType === 'free_roam'
  const missions = tour.missions
  const completed = missions.filter(m => tourProgress.missions[m.id]?.status === 'completed').length
  const progressPct = Math.round((completed / missions.length) * 100)
  // Free-roam has no fixed "next" — the player picks. Keeping nextMission null
  // makes the map show the full overview and hides the single-leg callouts.
  const nextMission = isFreeRoam
    ? null
    : missions.find(m => tourProgress.missions[m.id]?.status === 'unlocked')

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

  // The stop we surface a prominent distance to. Sequential: the next unlocked
  // stop. Free-roam: the nearest stop the player hasn't finished yet.
  const targetMission = (() => {
    if (!isFreeRoam) return nextMission
    const incomplete = missions.filter(m => tourProgress.missions[m.id]?.status !== 'completed')
    if (!incomplete.length) return null
    if (!gpsActive) return incomplete[0]
    let best = null, bestD = Infinity
    for (const m of incomplete) {
      const d = distances[m.id]
      if (d != null && d < bestD) { bestD = d; best = m }
    }
    return best ?? incomplete[0]
  })()
  const targetDist = targetMission ? distances[targetMission.id] : null

  // Journey progression: done stops (collapsed above), the current/target stop
  // (prominent), and everything still ahead ("Coming up").
  const currentStop = targetMission
  const doneStops = missions.filter(m => tourProgress.missions[m.id]?.status === 'completed')
  const comingUp = missions.filter(m =>
    tourProgress.missions[m.id]?.status !== 'completed' && m.id !== currentStop?.id
  )

  // "You're here" state with hysteresis: enter the zone at GPS_RADIUS, only drop
  // out once clearly beyond it (+15 m) so GPS jitter doesn't flicker the affordance.
  useEffect(() => {
    if (targetDist == null) { setArrivedTarget(false); return }
    setArrivedTarget(prev => {
      if (!prev && targetDist <= GPS_RADIUS) return true
      if (prev && targetDist > GPS_RADIUS + 15) return false
      return prev
    })
  }, [targetDist])

  // Auto-dismiss the "why you can't start this yet" hint after 4 s
  useEffect(() => {
    if (!blockedHint) return
    const t = setTimeout(() => setBlockedHint(null), 4000)
    return () => clearTimeout(t)
  }, [blockedHint])

  function handleOpenMission(missionId) {
    const mission = missions.find(m => m.id === missionId)
    const status = tourProgress.missions[missionId]?.status
    // Completed/skipped stops open in read-only review mode (no GPS gate) so the
    // player can re-read the story, replay the audio, or download their photo.
    if (status === 'completed') { setBlockedHint(null); onOpenMission(missionId); return }

    // Sequence-locked (sequential tours only — free-roam never locks): tell the
    // player which stop to finish first instead of doing nothing.
    if (status !== 'unlocked') {
      const n = currentStop ? missions.findIndex(m => m.id === currentStop.id) + 1 : null
      setBlockedHint({ id: missionId, message: n ? t('hub_locked_sequence', { stop: n }) : t('hub_locked_generic') })
      return
    }

    // Distance gate (both tour types): same 300m reach radius as the challenge,
    // so GPS drift won't block you when you're actually there.
    if (gpsActive && mission.coordinates) {
      const dist = distances[missionId] ?? Infinity
      if (dist > REACH_RADIUS) {
        setBlockedHint({ id: missionId, message: t('hub_toast_warn', { distance: formatDistance(dist) }) })
        return
      }
    }
    setBlockedHint(null)
    onOpenMission(missionId)
  }


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
            <span className="text-white/80 text-xs font-medium">{t('hub_back_to_tours')}</span>
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
              {t('hub_progress_of', { completed, total: missions.length })} {t('hub_progress_stops')}
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

      </div>

      {/* ── Done so far (collapsed, above the current step) ──── */}
      {doneStops.length > 0 && (
        <div className="flex-shrink-0 mx-4 mt-3">
          <button
            onClick={() => setShowDone(v => !v)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl active:scale-[0.99] transition-transform"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <CheckCircle2 className="w-4 h-4 text-green-400/70 flex-shrink-0" />
            <span className="text-white/55 text-xs font-semibold tracking-widest uppercase flex-1 text-left">
              {t('hub_done')} · {doneStops.length}
            </span>
            {showDone ? <ChevronUp className="w-4 h-4 text-white/35" /> : <ChevronDown className="w-4 h-4 text-white/35" />}
          </button>
          {showDone && (
            <div className="flex flex-col gap-2 mt-2">
              {doneStops.map(m => (
                <CompactMissionCard
                  key={m.id}
                  mission={m}
                  progress={tourProgress.missions[m.id]}
                  index={missions.findIndex(x => x.id === m.id)}
                  onOpen={handleOpenMission}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Current step — stop header + its map + arrival, one unit ── */}
      {currentStop && (
        <div
          className="flex-shrink-0 mx-4 mt-3 rounded-2xl overflow-hidden"
          style={arrivedTarget
            ? { border: '1px solid rgba(34,197,94,0.55)', boxShadow: '0 0 22px rgba(34,197,94,0.22)' }
            : { border: `1px solid ${currentStop.accentColor}66`, boxShadow: `0 0 16px ${currentStop.accentColor}1f` }}
        >
          {/* Header — tap to start */}
          <button
            onClick={() => handleOpenMission(currentStop.id)}
            className="w-full text-left p-4 flex items-center gap-4 active:scale-[0.99] transition-transform"
            style={{ background: arrivedTarget ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.04)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: arrivedTarget ? 'rgba(34,197,94,0.2)' : `${currentStop.accentColor}22`, border: `1px solid ${arrivedTarget ? 'rgba(34,197,94,0.35)' : `${currentStop.accentColor}33`}` }}>
              {currentStop.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white/40 text-xs font-semibold tracking-wider uppercase">
                  {t('mission_stop')} {missions.findIndex(m => m.id === currentStop.id) + 1}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={arrivedTarget ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80' } : { background: `${currentStop.accentColor}22`, color: currentStop.accentColor }}>
                  {arrivedTarget ? t('hub_here') : t('hub_next')}
                </span>
              </div>
              <div className="text-white font-semibold text-sm truncate">{currentStop.title}</div>
              <div className="text-white/50 text-xs truncate mt-0.5">{currentStop.location}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {gpsActive && targetDist != null && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={arrivedTarget ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80' } : { background: 'rgba(251,191,36,0.15)', color: '#fcd34d' }}>
                  {arrivedTarget ? t('hub_nearby') : formatDistance(targetDist)}
                </span>
              )}
              <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: arrivedTarget ? '#4ade80' : currentStop.accentColor }}>
                {t('hub_start_challenge')} <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* Subtle reason it can't start yet (tapped while too far) */}
          {blockedHint && blockedHint.id === currentStop.id && (
            <div className="flex items-center gap-1.5 px-4 py-2 animate-fade-in"
              style={{ background: 'rgba(245,158,11,0.12)', borderTop: '1px solid rgba(245,158,11,0.2)' }}>
              <MapPin className="w-3 h-3 text-amber-300/80 flex-shrink-0" />
              <span className="text-amber-200/90 text-xs">{blockedHint.message}</span>
            </div>
          )}

          {/* This stop's map */}
          <div className="relative">
            <MapView
              missions={[currentStop]}
              missionProgress={tourProgress.missions}
              height={220}
              interactive={true}
              accentColor={tour.accentColor}
              singleMode={true}
              userPosition={userPos}
              extraFitPoints={userPos ? [[userPos.lat, userPos.lng]] : null}
              geofenceStop={currentStop.coordinates || null}
              geofenceActive={arrivedTarget}
            />
            <button
              onClick={() => setFullscreen(true)}
              className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.55)', zIndex: 400 }}
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Footer — arrival CTA when here, else GPS status */}
          {arrivedTarget ? (
            <button
              onClick={() => handleOpenMission(currentStop.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 active:opacity-90 transition-opacity"
              style={{ background: 'rgba(34,197,94,0.16)', borderTop: '1px solid rgba(34,197,94,0.3)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-semibold">{t('hub_arrived_here')}</span>
              <ChevronRight className="w-4 h-4 text-green-300" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(6,15,30,0.85)' }}>
              {gpsActive ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                  <span className="text-white/50 text-xs">{t('hub_gps_active')}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-white/25 flex-shrink-0" />
                  <span className="text-white/25 text-xs">{t('hub_gps_inactive')}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Overview map fallback when there's no active stop (all done) */}
      {!currentStop && (
        <div className="flex-shrink-0 mx-4 mt-3">
          <div className="rounded-2xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <MapView
              missions={missions}
              missionProgress={tourProgress.missions}
              height={190}
              interactive={true}
              accentColor={tour.accentColor}
              userPosition={userPos}
            />
            <button
              onClick={() => setFullscreen(true)}
              className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.55)', zIndex: 400 }}
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── Coming up (stops after the current one) ──────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-safe">
        {comingUp.length > 0 && (
          <>
            <div className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-3 px-1">
              {t('hub_coming_up')}
            </div>
            <div className="flex flex-col gap-2.5 stagger-children">
              {comingUp.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  progress={tourProgress.missions[mission.id]}
                  index={missions.findIndex(m => m.id === mission.id)}
                  onOpen={handleOpenMission}
                  distance={distances[mission.id]}
                  gpsActive={gpsActive}
                  isTarget={false}
                  hint={blockedHint?.id === mission.id ? blockedHint.message : null}
                />
              ))}
            </div>
          </>
        )}

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
              height={window.innerHeight - (targetMission ? 76 : 0)}
              interactive={true}
              accentColor={tour.accentColor}
              userPosition={userPos}
              geofenceStop={targetMission?.coordinates || null}
              geofenceActive={arrivedTarget}
            />
            <button
              onClick={() => setFullscreen(false)}
              className="absolute right-4 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Tour label */}
            <div
              className="absolute left-4 px-3 py-1.5 rounded-xl text-white text-xs font-semibold"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
            >
              {tour.title}
            </div>
          </div>

          {/* Bottom bar: "you're here → start" once in range, else stop + distance */}
          {targetMission && (
            arrivedTarget ? (
              <button
                onClick={() => { setFullscreen(false); handleOpenMission(targetMission.id) }}
                className="flex items-center gap-3 px-4 py-4 w-full text-left active:scale-[0.99] transition-transform"
                style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.95), rgba(34,197,94,0.95))', borderTop: '1px solid rgba(255,255,255,0.12)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/80 text-xs font-semibold">{t('hub_youre_here')}</div>
                  <div className="text-white font-bold text-sm truncate">{targetMission.title}</div>
                </div>
                <span className="flex items-center gap-1 text-white font-bold text-sm flex-shrink-0">
                  {t('hub_start_challenge')} <ChevronRight className="w-5 h-5" />
                </span>
              </button>
            ) : (
              <div
                className="flex items-center gap-3 px-4 py-4"
                style={{ background: 'rgba(6,15,30,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                {gpsActive && (
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white/50 text-xs">{isFreeRoam ? t('hub_nearest_stop') : t('hub_gps_next_stop')}</div>
                  <div className="text-white font-semibold text-sm truncate">{targetMission.title}</div>
                </div>
                {gpsActive && targetDist != null ? (
                  <span
                    className="text-sm font-bold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fcd34d' }}
                  >
                    {formatDistance(targetDist)}
                  </span>
                ) : null}
              </div>
            )
          )}
        </div>,
        document.body
      )}

      {/* ── Reset confirmation ──────────────────────────────── */}
      {showReset && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowReset(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl p-6 pb-safe animate-slide-up"
            style={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-2">{t('hub_reset_confirm_title')}</h3>
            <p className="text-white/50 text-sm mb-6">
              {t('hub_reset_confirm_text', { name: tour.title })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                {t('hub_reset_cancel')}
              </button>
              <button
                onClick={() => { setShowReset(false); onResetTour() }}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
              >
                {t('hub_reset_button')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Game rules dialog ───────────────────────────────── */}
      {showRules && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl p-6 pb-safe animate-slide-up"
            style={{ background: '#0a1929', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${tour.gradient[0]}, ${tour.gradient[1]})` }}
              >
                🗺️
              </div>
              <div>
                <h3 className="text-white font-bold text-xl leading-tight">{rcfg.heading || t('hub_rules_heading')}</h3>
                <p className="text-white/40 text-sm">{tour.title}</p>
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-3 mb-6">
              {[
                {
                  icon: isFreeRoam ? '🗺️' : '📍',
                  title: rcfg.rule1_title || (isFreeRoam ? t('hub_rules_free_roam') : t('hub_rules_walk')),
                  body: rcfg.rule1_body || (isFreeRoam ? t('hub_rules_free_roam_body') : t('hub_rules_walk_body')),
                },
                { icon: '📸', title: rcfg.rule2_title || t('hub_rules_challenge'), body: rcfg.rule2_body || t('hub_rules_challenge_body') },
                { icon: '💡', title: rcfg.rule3_title || t('hub_rules_hints'), body: rcfg.rule3_body || t('hub_rules_hints_body') },
                { icon: '⏭️', title: rcfg.rule4_title || t('hub_rules_skip'), body: rcfg.rule4_body || t('hub_rules_skip_body') },
              ].map(r => (
                <div key={r.icon} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">{r.icon}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{r.title}</div>
                    <div className="text-white/45 text-xs leading-relaxed mt-0.5">{r.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { localStorage.setItem(`bodrum-rules-seen-${tour.id}`, '1'); setShowRules(false) }}
              className="w-full py-4 rounded-xl font-bold text-base active:scale-[0.98] transition-transform"
              style={{
                background: `linear-gradient(135deg, ${tour.gradient[0]}, ${tour.gradient[1]})`,
                color: '#fff',
                boxShadow: `0 4px 20px ${tour.accentColor}33`,
              }}
            >
              {rcfg.start_label || t('hub_rules_start')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
