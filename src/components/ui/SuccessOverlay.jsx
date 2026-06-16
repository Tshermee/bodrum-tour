import { useEffect, useState } from 'react'
import { CheckCircle2, Star, ChevronRight, MapPin } from 'lucide-react'

export default function SuccessOverlay({ mission, nextMission, score, totalScore, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slight delay so the challenge completion animation plays first
    const t = setTimeout(() => setVisible(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center transition-opacity duration-300"
      style={{
        background: visible ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(6px)' : 'none',
      }}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl overflow-hidden transition-transform duration-400"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          background: 'linear-gradient(160deg, #041a3d 0%, #072b5c 50%, #0e7490 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>

        <div className="px-6 pt-4 pb-6">
          {/* Animated checkmark */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              {/* Glow ring */}
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(34, 197, 94, 0.2)', animationDuration: '1.5s' }}
              />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  boxShadow: '0 8px 32px rgba(34,197,94,0.4)',
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-white animate-checkmark" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-5">
            <div className="text-green-400 text-xs font-semibold tracking-[0.25em] uppercase mb-1">
              Mission Complete!
            </div>
            <h2 className="font-display text-white text-2xl font-bold">{mission.title}</h2>
          </div>

          {/* Score earned */}
          <div
            className="flex items-center justify-between px-5 py-4 rounded-2xl mb-4"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-white font-semibold">Points Earned</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-2xl font-black">+{score}</span>
            </div>
          </div>

          {/* Total score */}
          <div className="text-center text-white/40 text-sm mb-6">
            Total score: <span className="text-white font-bold">{totalScore}</span> pts
          </div>

          {/* Next mission preview */}
          {nextMission ? (
            <div
              className="rounded-2xl p-4 mb-4"
              style={{
                background: `linear-gradient(135deg, ${nextMission.gradient[0]}55, ${nextMission.gradient[1]}44)`,
                border: `1px solid ${nextMission.accentColor}33`,
              }}
            >
              <div className="text-white/50 text-xs tracking-wider uppercase mb-2">Up Next</div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  {nextMission.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm">{nextMission.title}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" style={{ color: nextMission.accentColor }} />
                    <span className="text-white/50 text-xs">{nextMission.location}</span>
                  </div>
                </div>
                <span className="text-white/30 text-xs">{nextMission.points} pts</span>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-4 mb-4 text-center"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              <div className="text-2xl mb-1">🎉</div>
              <div className="text-amber-400 font-semibold">Final stop completed!</div>
              <div className="text-white/50 text-sm">Time to see your results!</div>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={onDismiss}
            className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              background: nextMission
                ? `linear-gradient(135deg, ${nextMission.gradient[0]}, ${nextMission.gradient[1]})`
                : 'linear-gradient(135deg, #d97706, #f59e0b)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {nextMission ? (
              <>Continue <ChevronRight className="w-5 h-5" /></>
            ) : (
              <>See My Results 🏆</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
