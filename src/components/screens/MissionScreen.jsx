import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, MapPin, BookOpen, ChevronDown, ChevronUp, Maximize2, X, SkipForward, Volume2, Play, Pause } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getDistanceMeters } from '../../lib/geo'

const SKIP_RADIUS = 300      // metres — skip button visible when within this range
const COMPLETE_RADIUS = 300  // metres — challenge locked when farther than this

const SKIP_REASON_IDS = ['construction', 'accessibility', 'closed', 'notfound', 'other']
import PhotoChallenge from '../challenges/PhotoChallenge'
import RiddleChallenge from '../challenges/RiddleChallenge'
import CodeChallenge from '../challenges/CodeChallenge'
import MultipleChoiceChallenge from '../challenges/MultipleChoiceChallenge'
import ImageHuntChallenge from '../challenges/ImageHuntChallenge'
import MapView from '../ui/MapView'

function AudioGuide({ audioUrl, accentColor }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current || !audioRef.current.duration) return
    setProgress(audioRef.current.currentTime / audioRef.current.duration)
  }

  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-xl mb-3"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
        style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}33` }}
      >
        {playing
          ? <Pause className="w-4 h-4" style={{ color: accentColor }} />
          : <Play className="w-4 h-4" style={{ color: accentColor }} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.round(progress * 100)}%`, background: accentColor }}
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setPlaying(false); setProgress(0) }}
      />
    </div>
  )
}

export default function MissionScreen({
  mission,
  missionProgress,
  missionIndex,
  totalMissions,
  bypassGps = false,
  onComplete,
  onSkip,
  onBack,
}) {
  const { t } = useTranslation()
  const SKIP_REASONS = [
    { id: 'construction', label: t('mission_skip_reason_construction') },
    { id: 'accessibility', label: t('mission_skip_reason_accessibility') },
    { id: 'closed', label: t('mission_skip_reason_closed') },
    { id: 'notfound', label: t('mission_skip_reason_notfound') },
    { id: 'other', label: t('mission_skip_reason_other') },
  ]
  const [storyExpanded, setStoryExpanded] = useState(false)
  const [showFullMap, setShowFullMap] = useState(false)
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [skipNote, setSkipNote] = useState('')
  const isCompleted = missionProgress?.status === 'completed'

  const { position: userPos } = useGeolocation()
  const distToStop = userPos && mission.coordinates
    ? getDistanceMeters(userPos.lat, userPos.lng, mission.coordinates.lat, mission.coordinates.lng)
    : null
  // Show skip when GPS unavailable, no coords, within SKIP_RADIUS, or test mode on
  const canSkip = bypassGps || distToStop === null || distToStop <= SKIP_RADIUS
  // Allow completing only when GPS unavailable, no coords, within COMPLETE_RADIUS, or test mode on
  const canComplete = bypassGps || distToStop === null || distToStop <= COMPLETE_RADIUS

  function handleConfirmSkip() {
    onSkip(mission.id, skipReason, skipNote)
    setShowSkipDialog(false)
  }

  const handleComplete = (photoThumb = null, penalty = 0) => {
    if (!isCompleted && canComplete) onComplete(mission.id, photoThumb, penalty)
  }

  return (
    <div className="flex flex-col min-h-screen screen-enter">
      {bypassGps && (
        <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-semibold"
          style={{ background: 'rgba(234,179,8,0.15)', borderBottom: '1px solid rgba(234,179,8,0.3)', color: '#fbbf24' }}>
          🧪 {t('mission_test_mode')}
        </div>
      )}
      {/* Header */}
      <div
        className="relative pt-safe px-4 pb-5 flex-shrink-0"
        style={{ background: `linear-gradient(160deg, ${mission.gradient[0]}, ${mission.gradient[1]})` }}
      >
        {/* Back button */}
        <div className="flex items-center justify-between pt-2 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">{t('mission_back')}</span>
          </button>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/70"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            {missionIndex + 1} / {totalMissions}
          </div>
        </div>

        {/* Mission title area */}
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {mission.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-1">
              {t('mission_stop')} {missionIndex + 1} · {mission.points} {t('mission_pts')}
            </div>
            <h1 className="font-display text-white text-xl font-bold leading-tight">
              {mission.title}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mission.accentColor }} />
              <span className="text-white/60 text-xs truncate">{mission.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Photo (when chosen) or locator map with expand button */}
        {mission.showPhoto && mission.photoUrl ? (
          <div className="px-4 pt-3 pb-0">
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src={mission.photoUrl} alt={mission.title} className="w-full object-cover" style={{ maxHeight: 220 }} />
            </div>
          </div>
        ) : mission.coordinates && (
          <div className="px-4 pt-3 pb-0">
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <MapView
                missions={[mission]}
                height={160}
                interactive={true}
                accentColor={mission.accentColor}
                singleMode={true}
              />
              <button
                onClick={() => setShowFullMap(true)}
                className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', zIndex: 400 }}
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Story (read) + Audio guide (listen) — merged into one section */}
        <div className="px-4 py-4">
          <button
            onClick={() => setStoryExpanded(v => !v)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left active:scale-[0.99] transition-transform"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(251, 191, 36, 0.15)' }}>
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              {mission.audioUrl && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${mission.accentColor}22` }}>
                  <Volume2 className="w-4 h-4" style={{ color: mission.accentColor }} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">{t('mission_story')}</div>
              <div className="text-white/40 text-xs">
                {mission.audioUrl ? t('mission_story_read_listen') : (storyExpanded ? t('mission_story_hide') : t('mission_story_read'))}
              </div>
            </div>
            {storyExpanded
              ? <ChevronUp className="w-4 h-4 text-white/30" />
              : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>

          {storyExpanded && (
            <div className="mt-3 animate-fade-in">
              {mission.audioUrl && (
                <AudioGuide audioUrl={mission.audioUrl} accentColor={mission.accentColor} />
              )}
              <div
                className="px-4 py-4 rounded-xl text-white/70 text-sm leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {mission.story}
              </div>
            </div>
          )}
        </div>

        {/* Challenge area */}
        <div className="px-4 pb-4">
          <div className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-3">
            {t('mission_challenge_label')}
          </div>

          {!isCompleted && !canComplete && (
            <div
              className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-3xl">📍</div>
              <p className="text-white/70 text-sm font-medium">{t('mission_location_required')}</p>
              <p className="text-white/35 text-xs">
                {distToStop != null ? `${Math.round(distToStop)} ${t('mission_location_away')}` : t('mission_location_gps')}
              </p>
            </div>
          )}

          {(isCompleted || canComplete) && mission.challenge.type === 'photo' && (
            <PhotoChallenge
              challenge={mission.challenge}
              isCompleted={isCompleted}
              completedThumb={missionProgress?.photoThumb}
              accentColor={mission.accentColor}
              gradient={mission.gradient}
              onComplete={(thumb, penalty) => handleComplete(thumb, penalty)}
            />
          )}

          {(isCompleted || canComplete) && mission.challenge.type === 'riddle' && (
            <RiddleChallenge
              challenge={mission.challenge}
              isCompleted={isCompleted}
              accentColor={mission.accentColor}
              gradient={mission.gradient}
              onComplete={penalty => handleComplete(null, penalty)}
            />
          )}

          {(isCompleted || canComplete) && mission.challenge.type === 'code' && (
            <CodeChallenge
              challenge={mission.challenge}
              isCompleted={isCompleted}
              accentColor={mission.accentColor}
              gradient={mission.gradient}
              onComplete={penalty => handleComplete(null, penalty)}
            />
          )}

          {(isCompleted || canComplete) && mission.challenge.type === 'multiple_choice' && (
            <MultipleChoiceChallenge
              challenge={mission.challenge}
              isCompleted={isCompleted}
              accentColor={mission.accentColor}
              gradient={mission.gradient}
              onComplete={penalty => handleComplete(null, penalty)}
            />
          )}

          {(isCompleted || canComplete) && mission.challenge.type === 'image_hunt' && (
            <ImageHuntChallenge
              challenge={mission.challenge}
              isCompleted={isCompleted}
              accentColor={mission.accentColor}
              gradient={mission.gradient}
              onComplete={penalty => handleComplete(null, penalty)}
            />
          )}
        </div>

        {/* Skip option — shown only when not completed and within 300 m of stop */}
        {!isCompleted && canSkip && (
          <div className="px-4 pb-safe pb-8 flex justify-center">
            <button
              onClick={() => { setSkipReason(''); setSkipNote(''); setShowSkipDialog(true) }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-opacity active:opacity-60"
              style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <SkipForward className="w-3.5 h-3.5" />
              {t('mission_skip')}
            </button>
          </div>
        )}
      </div>

      {/* Skip confirmation dialog */}
      {showSkipDialog && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSkipDialog(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl p-6 pb-safe animate-slide-up"
            style={{ background: '#0d1f35', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <SkipForward className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{t('mission_skip_confirm_title')}</h3>
                <p className="text-white/45 text-sm mt-0.5">
                  {t('mission_skip_confirm_text')}
                </p>
              </div>
            </div>

            {/* Reason chips */}
            <div className="mb-5">
              <div className="text-white/35 text-xs font-semibold tracking-widest uppercase mb-2.5">
                {t('mission_skip_reason_label')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SKIP_REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSkipReason(skipReason === r.id ? '' : r.id)}
                    className="text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                    style={skipReason === r.id
                      ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {skipReason === 'other' && (
                <textarea
                  value={skipNote}
                  onChange={e => setSkipNote(e.target.value)}
                  rows={2}
                  className="mt-2 w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/40 placeholder-white/20"
                  placeholder={t('mission_skip_reason_placeholder')}
                  autoFocus
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipDialog(false)}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {t('mission_skip_cancel')}
              </button>
              <button
                onClick={handleConfirmSkip}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white active:scale-[0.98] transition-transform"
                style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
              >
                {t('mission_skip_button')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen map portal (avoids position:fixed issues inside screen-enter transform) */}
      {showFullMap && createPortal(
        <div className="fixed inset-0 flex flex-col" style={{ zIndex: 9999, background: '#050e1a' }}>
          <div className="relative flex-1" style={{ minHeight: 0 }}>
            <MapView
              missions={[mission]}
              height={window.innerHeight - 76}
              interactive={true}
              accentColor={mission.accentColor}
              singleMode={true}
            />
            <button
              onClick={() => setShowFullMap(false)}
              className="absolute right-4 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div
              className="absolute left-4 px-3 py-1.5 rounded-xl text-white text-xs font-semibold"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
            >
              {mission.title}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
