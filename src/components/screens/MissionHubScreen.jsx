import { useState } from 'react'
import { Star, Lock, CheckCircle2, ChevronRight, RotateCcw, Trophy, Zap, ArrowLeft } from 'lucide-react'

function MissionCard({ mission, progress, index, onOpen }) {
  const status = progress?.status ?? 'locked'
  const isLocked = status === 'locked'
  const isCompleted = status === 'completed'
  const isUnlocked = status === 'unlocked'

  return (
    <button
      onClick={() => !isLocked && onOpen(mission.id)}
      disabled={isLocked}
      className={`
        w-full text-left rounded-2xl overflow-hidden transition-all duration-200
        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
        ${isUnlocked ? 'glow-cyan' : ''}
      `}
    >
      <div
        className="relative p-4 flex items-center gap-4"
        style={{
          background: isLocked
            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
            : isCompleted
              ? `linear-gradient(135deg, ${mission.gradient[0]}88, ${mission.gradient[1]}88)`
              : `linear-gradient(135deg, ${mission.gradient[0]}, ${mission.gradient[1]})`,
          border: isUnlocked
            ? `1px solid ${mission.accentColor}55`
            : isCompleted
              ? '1px solid rgba(34, 197, 94, 0.25)'
              : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Stop number / status badge */}
        <div
          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{
            background: isCompleted
              ? 'rgba(34, 197, 94, 0.2)'
              : isLocked
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.15)',
            border: isCompleted
              ? '1px solid rgba(34,197,94,0.3)'
              : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {isCompleted
            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
            : isLocked
              ? <Lock className="w-4 h-4 text-white/30" />
              : <span className="text-white">{mission.emoji}</span>}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-white/40 text-xs font-semibold tracking-wider">STOP {index + 1}</span>
            {isUnlocked && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${mission.accentColor}22`, color: mission.accentColor }}
              >
                NOW
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-sm truncate">{mission.title}</div>
          <div className="text-white/50 text-xs truncate mt-0.5">{mission.location}</div>
        </div>

        {/* Right */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isCompleted ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 text-sm font-bold">{progress.score}</span>
            </div>
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

  const missions = tour.missions
  const completed = missions.filter(m => tourProgress.missions[m.id]?.status === 'completed').length
  const progressPct = Math.round((completed / missions.length) * 100)
  const nextMission = missions.find(m => tourProgress.missions[m.id]?.status === 'unlocked')

  return (
    <div className="flex flex-col min-h-screen screen-enter-up">
      {/* Header */}
      <div
        className="relative pt-safe px-5 pb-5 flex-shrink-0"
        style={{ background: `linear-gradient(180deg, ${tour.gradient[0]} 0%, ${tour.gradient[1]}cc 100%)` }}
      >
        {/* Top bar */}
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
            {/* Score badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251,191,36,0.25)' }}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">{tourProgress.totalScore}</span>
            </div>
            {/* Reset */}
            <button
              onClick={() => setShowReset(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <RotateCcw className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>

        {/* Tour title + team */}
        <div className="mb-4">
          <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-0.5">
            {teamName}
          </div>
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

        {/* Next mission callout */}
        {nextMission && (
          <button
            onClick={() => onOpenMission(nextMission.id)}
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
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        )}
      </div>

      {/* Mission list */}
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
              onOpen={onOpenMission}
            />
          ))}
        </div>

        <div className="mt-4 px-1 text-center">
          <p className="text-white/20 text-xs">
            {tour.title} · {tour.totalPossibleScore} pts possible
          </p>
        </div>
      </div>

      {/* Reset confirmation */}
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
              Progress for <span className="text-white font-medium">{tour.title}</span> will be reset. You'll go back to tour selection.
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
