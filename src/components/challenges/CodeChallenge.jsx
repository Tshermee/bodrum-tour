import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Hash, CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function CodeChallenge({ challenge, isCompleted, accentColor, gradient, onComplete }) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lastWrong, setLastWrong] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [showHintWarning, setShowHintWarning] = useState(false)
  const inputRef = useRef(null)

  const normalize = (s) => s.trim().toUpperCase().replace(/\s/g, '')

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!code.trim()) return

    if (normalize(code) === normalize(challenge.code)) {
      const penalty = (hintUsed ? 20 : 0) + attempts * 10
      onComplete(penalty)
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setLastWrong(true)
      if (newAttempts >= 2) setHintOpen(true)
      // Briefly shake the input
      if (inputRef.current) {
        inputRef.current.style.transform = 'translateX(-6px)'
        setTimeout(() => {
          if (inputRef.current) inputRef.current.style.transform = 'translateX(6px)'
          setTimeout(() => {
            if (inputRef.current) inputRef.current.style.transform = 'translateX(0)'
          }, 80)
        }, 80)
      }
    }
  }

  if (isCompleted) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-3 animate-scale-in"
        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
      >
        <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
        <div>
          <div className="text-green-400 font-semibold">{t('code_challenge_accepted')}</div>
          <div className="text-white/50 text-sm font-mono">{challenge.code}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Instruction card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: accentColor }}>
            {t('code_challenge_label')}
          </span>
        </div>
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
          {challenge.instruction}
        </p>
      </div>

      {/* Hint */}
      {challenge.hint && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <button
            onClick={() => {
              if (hintUsed || hintOpen) { setHintOpen(v => !v) }
              else { setShowHintWarning(true) }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 active:opacity-80"
            style={{ background: 'rgba(251,191,36,0.08)' }}
          >
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-400 text-sm font-medium flex-1 text-left">
              {hintUsed ? t('code_challenge_hint_used') : attempts >= 2 ? t('code_challenge_hint_warning') : t('code_challenge_hint_unused')}
            </span>
            {hintOpen ? <ChevronUp className="w-4 h-4 text-amber-400/60" /> : <ChevronDown className="w-4 h-4 text-amber-400/60" />}
          </button>
          {hintOpen && (
            <div className="px-4 pb-3 pt-1 animate-fade-in"
              style={{ background: 'rgba(251,191,36,0.05)' }}>
              <p className="text-white/60 text-sm leading-relaxed">{challenge.hint}</p>
            </div>
          )}
        </div>
      )}

      {/* Code input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <div
            ref={inputRef}
            className="transition-transform"
            style={{
              borderRadius: '0.75rem',
              border: lastWrong
                ? '1px solid rgba(239,68,68,0.5)'
                : `1px solid ${accentColor}44`,
              background: lastWrong
                ? 'rgba(239,68,68,0.08)'
                : 'rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center px-4 py-3.5 gap-3">
              <Hash className="w-5 h-5 flex-shrink-0"
                style={{ color: lastWrong ? '#f87171' : accentColor }} />
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setLastWrong(false) }}
                placeholder={t('code_challenge_placeholder')}
                className="flex-1 bg-transparent text-white placeholder-white/25 text-lg font-mono font-bold tracking-widest focus:outline-none uppercase"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
              {lastWrong && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
            </div>
          </div>
          {lastWrong && (
            <p className="text-red-400/80 text-xs mt-1.5 ml-1 animate-fade-in">
              {t('code_challenge_error')}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!code.trim()}
          className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            boxShadow: code.trim() ? `0 4px 16px ${accentColor}33` : 'none',
          }}
        >
          <Send className="w-4 h-4" />
          {t('code_challenge_submit')}
        </button>
      </form>

      {attempts > 0 && (
        <p className="text-white/25 text-xs text-center">
          {attempts} attempt{attempts !== 1 ? 's' : ''} · You've got this!
        </p>
      )}

      {showHintWarning && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHintWarning(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl p-6 pb-safe"
            style={{ background: '#0d1f35', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{t('hint_warning_title')}</h3>
                <p className="text-white/50 text-sm mt-0.5">
                  {t('hint_warning_deduct')} <span className="text-amber-400 font-semibold">20 {t('hint_warning_from_score')}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHintWarning(false)}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {t('hint_cancel')}
              </button>
              <button
                onClick={() => { setHintUsed(true); setHintOpen(true); setShowHintWarning(false) }}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #b45309, #d97706)' }}
              >
                {t('code_hint_reveal')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
