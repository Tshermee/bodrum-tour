import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, Clock, MapPin, Star, Loader2, Lock, Zap } from 'lucide-react'

const FEATURES = {
  short: [
    '📍 Curated stop-by-stop route',
    '📸 Photo challenges & fun puzzles',
    '💡 Hints always available',
    '🔄 Replay anytime, keep forever',
  ],
  full: [
    '📍 Curated stop-by-stop route with stories',
    '🧩 Mix of photo, riddle & code challenges',
    '🗺️ Offline-ready map for every stop',
    '💡 Hints always available',
    '🏆 Score tracking & completion certificate',
    '🔄 Replay anytime, keep forever',
  ],
}

export default function PurchaseModal({ tour, onPurchase, onClose }) {
  const [step, setStep] = useState('preview') // 'preview' | 'processing' | 'success'

  const isShort = tour.price <= 5
  const features = isShort ? FEATURES.short : FEATURES.full

  const handlePay = () => {
    setStep('processing')
    setTimeout(() => {
      setStep('success')
      setTimeout(() => {
        onPurchase(tour.id)
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
              <div className="text-white/40 text-xs uppercase tracking-widest mb-1">One-time purchase</div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-white/60 text-2xl font-light">€</span>
                <span className="text-white font-black text-6xl leading-none">{tour.price}</span>
              </div>
              <div className="text-white/30 text-xs mt-1">Yours forever · No subscription</div>
            </div>

            {/* Features */}
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">
                What's included
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
              Purchase for €{tour.price}
            </button>

            <p className="text-center text-white/20 text-xs mt-3">
              Simulated purchase · No real payment processed
            </p>
          </div>
        )}

        {step === 'processing' && (
          <div className="px-4 py-10 pb-12 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <div className="text-white font-semibold">Processing payment…</div>
            <div className="text-white/40 text-sm">Please wait</div>
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
            <div className="text-white font-bold text-lg">Purchase complete!</div>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              Starting your adventure…
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
