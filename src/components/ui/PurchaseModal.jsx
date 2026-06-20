import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, Clock, MapPin, Star, Loader2, Lock, Zap, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchDiscountCode, applyDiscount } from '../../lib/api'

export default function PurchaseModal({ tour, onPurchase, onClose }) {
  const { t } = useTranslation()
  const [step, setStep] = useState('preview') // 'preview' | 'processing' | 'success'
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState(null) // validated discount row
  const [checking, setChecking] = useState(false)
  const [codeError, setCodeError] = useState('')

  const { final, saved } = applyDiscount(tour.price, applied)

  const handleApply = async () => {
    setCodeError('')
    setChecking(true)
    try {
      const dc = await fetchDiscountCode(code)
      if (!dc) { setApplied(null); setCodeError(t('purchase_discount_invalid')) }
      else setApplied(dc)
    } catch {
      setApplied(null); setCodeError(t('purchase_discount_invalid'))
    } finally {
      setChecking(false)
    }
  }

  const SHORT_FEATURES = [
    `📍 ${t('purchase_feature_route')}`,
    `📸 ${t('purchase_feature_challenges')}`,
    `💡 ${t('purchase_feature_hints')}`,
    `🔄 ${t('purchase_feature_replay')}`,
  ]
  const FULL_FEATURES = [
    `📍 ${t('purchase_feature_route_full')}`,
    `🧩 ${t('purchase_feature_challenges_full')}`,
    `🗺️ ${t('purchase_feature_map')}`,
    `💡 ${t('purchase_feature_hints')}`,
    `🏆 ${t('purchase_feature_score')}`,
    `🔄 ${t('purchase_feature_replay')}`,
  ]

  const isShort = tour.price <= 5
  const features = isShort ? SHORT_FEATURES : FULL_FEATURES

  const handlePay = () => {
    setStep('processing')
    setTimeout(() => {
      setStep('success')
      setTimeout(() => {
        onPurchase(tour.id, applied ? { discountCode: applied.code, discountAmount: saved, finalAmount: final } : null)
        onClose()
      }, 1600)
    }, 1800)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={step === 'preview' ? onClose : undefined}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl overflow-hidden animate-slide-up"
        style={{
          background: '#0a1628',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Tour header */}
        <div
          className="relative mx-4 mt-1 mb-4 rounded-2xl p-4 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${tour.gradient[0]}, ${tour.gradient[1]})` }}
        >
          {step === 'preview' && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {tour.coverEmoji}
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">{tour.title}</div>
              <div className="text-white/60 text-sm mt-0.5">{tour.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-white/50" />
              <span className="text-white/70 text-xs">{tour.stops} stops</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/50" />
              <span className="text-white/70 text-xs">{tour.durationLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-white/50" />
              <span className="text-white/70 text-xs">{tour.totalPossibleScore} pts</span>
            </div>
          </div>
        </div>

        {/* Content depends on step */}
        {step === 'preview' && (
          <div className="px-4 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            {/* Price */}
            <div className="text-center mb-5">
              <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{t('purchase_one_time')}</div>
              <div className="flex items-baseline justify-center gap-2">
                {saved > 0 && (
                  <span className="text-white/30 text-2xl font-light line-through">€{tour.price}</span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-white/60 text-2xl font-light">€</span>
                  <span className="text-white font-black text-6xl leading-none">{final}</span>
                </div>
              </div>
              {saved > 0
                ? <div className="text-green-400 text-xs mt-1 font-semibold">{t('purchase_discount_saved', { amount: saved })}</div>
                : <div className="text-white/30 text-xs mt-1">{t('purchase_price_footer')}</div>}
            </div>

            {/* Discount code */}
            <div className="mb-5">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-xl px-3"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${applied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                  <Tag className="w-4 h-4 flex-shrink-0" style={{ color: applied ? '#4ade80' : 'rgba(255,255,255,0.4)' }} />
                  <input
                    value={code}
                    onChange={e => { setCode(e.target.value); setApplied(null); setCodeError('') }}
                    placeholder={t('purchase_discount_placeholder')}
                    className="flex-1 bg-transparent py-2.5 text-white text-sm placeholder-white/30 focus:outline-none uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={checking || !code.trim()}
                  className="px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-40 active:scale-95 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : t('purchase_discount_apply')}
                </button>
              </div>
              {codeError && <p className="text-red-400/80 text-xs mt-1.5 ml-1">{codeError}</p>}
              {applied && <p className="text-green-400 text-xs mt-1.5 ml-1">✓ {applied.code}</p>}
            </div>

            {/* Features */}
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">
                {t('purchase_included')}
              </div>
              <div className="flex flex-col gap-2.5">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: tour.accentColor }} />
                    <span className="text-white/70 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${tour.gradient[0]}, ${tour.accentColor})`,
                boxShadow: `0 4px 20px ${tour.accentColor}44`,
              }}
            >
              <Lock className="w-4 h-4" />
              {t('purchase_button', { price: final })}
            </button>

            <p className="text-center text-white/20 text-xs mt-3">
              {t('purchase_simulated')}
            </p>
          </div>
        )}

        {step === 'processing' && (
          <div className="px-4 py-10 pb-12 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <div className="text-white font-semibold">{t('purchase_processing')}</div>
            <div className="text-white/40 text-sm">{t('purchase_wait')}</div>
          </div>
        )}

        {step === 'success' && (
          <div className="px-4 py-10 pb-12 flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl animate-scale-in"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                boxShadow: '0 4px 24px rgba(34,197,94,0.5)',
              }}
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div className="text-white font-bold text-lg">{t('purchase_success')}</div>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              {t('purchase_starting')}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
