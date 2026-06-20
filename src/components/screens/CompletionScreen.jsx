import { useState, useEffect } from 'react'
import { Trophy, Star, Clock, RotateCcw, Gift, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import RewardsModal from '../ui/RewardsModal'
import { fetchAppConfig } from '../../lib/api'

function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return '—'
  const ms = new Date(endIso) - new Date(startIso)
  const totalMin = Math.floor(ms / 60000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${totalMin}m`
}

function getRank(score, maxScore, t) {
  const pct = score / maxScore
  if (pct >= 0.93) return { label: t('completion_rank_legend'), emoji: '🏆', color: '#fbbf24' }
  if (pct >= 0.75) return { label: t('completion_rank_voyager'), emoji: '⭐', color: '#22d3ee' }
  if (pct >= 0.55) return { label: t('completion_rank_explorer'), emoji: '🗺️', color: '#60a5fa' }
  return { label: t('completion_rank_adventurer'), emoji: '⛵', color: '#a78bfa' }
}

export default function CompletionScreen({ tour, tourProgress, teamName, lifetimePoints = 0, redeemedRewards = [], onRedeem, onReset, onBackToSelect }) {
  const { t, i18n } = useTranslation()
  const [showRewards, setShowRewards] = useState(false)
  const [appCfg, setAppCfg] = useState(null)
  const lang = (i18n.language || 'en').split('-')[0]

  useEffect(() => {
    fetchAppConfig('completion').then(setAppCfg).catch(() => {})
  }, [])

  const cfg = appCfg?.[lang] || appCfg?.en || {}
  const duration = formatDuration(tourProgress.startTime, tourProgress.completedAt)
  const rank = getRank(tourProgress.totalScore, tour.totalPossibleScore, t)
  const pct = Math.round((tourProgress.totalScore / tour.totalPossibleScore) * 100)

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden screen-enter-up">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, #041a3d 0%, ${tour.gradient[0]}cc 40%, ${tour.gradient[1]}99 100%)`,
        }}
      />

      {/* Decorative glow */}
      <div
        className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-15"
        style={{ background: `radial-gradient(circle, ${tour.accentColor}, transparent)` }}
      />

      {/* Floating confetti dots */}
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-float"
          style={{
            left: `${10 + (i * 53) % 80}%`,
            top: `${5 + (i * 37) % 40}%`,
            background: [tour.accentColor, '#fbbf24', '#60a5fa', '#34d399', '#f472b6'][i % 5],
            animationDelay: `${(i * 0.28) % 3}s`,
            animationDuration: `${3 + (i % 3)}s`,
            opacity: 0.55,
          }}
        />
      ))}

      {/* Back to tours button */}
      <div className="relative pt-safe px-5 pt-4">
        <button
          onClick={onBackToSelect}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-transform mt-2"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span className="text-white/80 text-xs font-medium">{t('hub_back_to_tours')}</span>
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-4">
        {/* Trophy */}
        <div className="mb-5 animate-confetti-pop">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${tour.gradient[0]}, ${tour.accentColor})`,
              boxShadow: `0 8px 40px ${tour.accentColor}55`,
            }}
          >
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="text-center mb-6 animate-slide-up">
          <div
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-2"
            style={{ color: rank.color }}
          >
            {rank.emoji} {rank.label}
          </div>
          <h1 className="font-display text-white text-3xl font-black mb-1">{cfg.heading_main || t('completion_heading')}</h1>
          <h1 className="font-display text-3xl font-black italic" style={{ color: tour.accentColor }}>
            {cfg.heading_sub || t('completion_heading_sub')}
          </h1>
          {cfg.message ? (
            <p className="text-white/60 text-sm mt-3 leading-relaxed max-w-[320px] mx-auto whitespace-pre-line">{cfg.message}</p>
          ) : (
            <p className="text-white/50 text-sm mt-3">
              <span className="text-white font-semibold">{teamName}</span> finished{' '}
              <span className="text-white font-semibold">{tour.title}</span>
            </p>
          )}
        </div>

        {/* Score card */}
        <div
          className="w-full rounded-2xl p-5 mb-5 animate-scale-in"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="text-center mb-4">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">{t('completion_final_score')}</div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-black" style={{ color: tour.accentColor }}>
                {tourProgress.totalScore}
              </span>
              <span className="text-white/30 text-xl">/ {tour.totalPossibleScore}</span>
            </div>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${tour.gradient[1]}, ${tour.accentColor})`,
                  boxShadow: `0 0 8px ${tour.accentColor}66`,
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <div className="text-white font-bold text-sm">{duration}</div>
              <div className="text-white/40 text-xs">{t('completion_duration')}</div>
            </div>
            <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 mx-auto mb-1" />
              <div className="text-white font-bold text-sm">{tour.stops}/{tour.stops}</div>
              <div className="text-white/40 text-xs">{t('completion_stops')}</div>
            </div>
            <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-white font-bold text-sm">{pct}%</div>
              <div className="text-white/40 text-xs">{t('completion_score_label')}</div>
            </div>
          </div>
        </div>

        {/* Per-stop breakdown */}
        <div className="w-full mb-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="text-white/30 text-xs tracking-widest uppercase mb-2">{t('completion_breakdown')}</div>
          <div className="flex flex-col gap-1.5">
            {tour.missions.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-base w-6">{m.emoji}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(((tourProgress.missions[m.id]?.score ?? 0) / m.points) * 100)}%`,
                      background: `linear-gradient(90deg, ${m.gradient[0]}, ${m.gradient[1]})`,
                    }}
                  />
                </div>
                <span className="text-white/50 text-xs w-14 text-right">
                  {tourProgress.missions[m.id]?.score ?? 0} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-3 pb-safe">
          <button
            onClick={() => setShowRewards(true)}
            className="flex-1 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
          >
            <Gift className="w-4 h-4" />
            {t('completion_redeem')}
          </button>
          <button
            onClick={onBackToSelect}
            className="flex-1 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              background: `linear-gradient(135deg, ${tour.gradient[0]}, ${tour.accentColor})`,
              boxShadow: `0 4px 16px ${tour.accentColor}33`,
            }}
          >
            <RotateCcw className="w-4 h-4" />
            {t('completion_more_tours')}
          </button>
        </div>
      </div>

      {showRewards && (
        <RewardsModal
          balance={lifetimePoints}
          redeemedRewards={redeemedRewards}
          onRedeem={(reward) => onRedeem?.(reward)}
          onClose={() => setShowRewards(false)}
        />
      )}
    </div>
  )
}
