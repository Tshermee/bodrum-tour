import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Star, Gift, CheckCircle2, Lock, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchAppConfig } from '../../lib/api'
import { DEFAULT_REWARDS, pickLang } from '../../lib/rewards'

function RewardCode({ reward, redeemedAt }) {
  const { t } = useTranslation()
  // Use the admin-set code if present, otherwise generate a unique one.
  const code = (reward.code || '').trim()
    || `BDR-${String(reward.id).toUpperCase()}-${new Date(redeemedAt).getTime().toString(36).toUpperCase().slice(-5)}`
  return (
    <div className="mt-2 px-3 py-2 rounded-lg text-center"
      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
      <div className="text-green-400 font-mono font-bold text-sm tracking-widest">{code}</div>
      {reward.link && (
        <a href={reward.link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1.5 text-cyan-400 text-xs font-medium">
          <ExternalLink className="w-3 h-3" /> {t('rewards_open_link')}
        </a>
      )}
      <div className="text-white/30 text-xs mt-0.5">{t('rewards_code_show')}</div>
    </div>
  )
}

export default function RewardsModal({ balance, redeemedRewards, onRedeem, onClose }) {
  const { t, i18n } = useTranslation()
  const [rewards, setRewards] = useState(DEFAULT_REWARDS)
  const lang = (i18n.language || 'en').split('-')[0]

  useEffect(() => {
    fetchAppConfig('rewards')
      .then(cfg => { if (Array.isArray(cfg?.items) && cfg.items.length) setRewards(cfg.items) })
      .catch(() => {})
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl overflow-hidden"
        style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" /> {t('rewards_title')}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 font-bold">{balance.toLocaleString()}</span>
              <span className="text-white/40 text-sm">{t('rewards_points_available')}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Rewards list */}
        <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: 'calc(85vh - 120px)', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <div className="flex flex-col gap-3">
            {rewards.map(reward => {
              const redemption = redeemedRewards.find(r => r.id === reward.id)
              const canAfford = balance >= reward.points
              const isRedeemed = !!redemption
              const title = pickLang(reward.title, lang)
              const desc = pickLang(reward.desc, lang)

              return (
                <div key={reward.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: isRedeemed ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.04)',
                    border: isRedeemed ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{reward.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: canAfford || isRedeemed ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                            color: canAfford || isRedeemed ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                          }}>
                          {reward.points} pts
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{desc}</p>
                      {isRedeemed && <RewardCode reward={reward} redeemedAt={redemption.redeemedAt} />}
                    </div>
                    {!isRedeemed && (
                      <button
                        onClick={() => {
                          if (!canAfford) return
                          if (window.confirm(`Redeem "${title}" for ${reward.points} pts?`)) {
                            onRedeem(reward)
                          }
                        }}
                        disabled={!canAfford}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        style={canAfford
                          ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {canAfford ? <><Gift className="w-3.5 h-3.5" /> {t('rewards_redeem')}</> : <><Lock className="w-3 h-3" /> {reward.points - balance} more</>}
                      </button>
                    )}
                    {isRedeemed && (
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-center text-white/15 text-xs mt-5">
            {t('rewards_code_footer')}
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
