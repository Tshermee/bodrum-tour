import { useState } from 'react'
import { HelpCircle, CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp, Send } from 'lucide-react'

export default function RiddleChallenge({ challenge, isCompleted, accentColor, gradient, onComplete }) {
  const [answer, setAnswer] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lastWrong, setLastWrong] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [shake, setShake] = useState(false)

  const normalize = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!answer.trim()) return

    if (normalize(answer) === normalize(challenge.answer)) {
      onComplete()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setLastWrong(true)
      setShake(true)
      setTimeout(() => setShake(false), 600)
      if (newAttempts >= 2) setHintOpen(true)
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
          <div className="text-green-400 font-semibold">Correct!</div>
          <div className="text-white/50 text-sm capitalize">"{challenge.answer}"</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Riddle card */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${gradient[0]}33, ${gradient[1]}22)`,
          border: `1px solid ${accentColor}33`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: accentColor }}>
            Riddle
          </span>
        </div>
        <p className="text-white/85 text-sm leading-relaxed whitespace-pre-line font-medium">
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
            onClick={() => setHintOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 active:opacity-80"
            style={{ background: 'rgba(251,191,36,0.08)' }}
          >
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-400 text-sm font-medium flex-1 text-left">
              {attempts >= 2 ? 'Hint unlocked after 2 wrong attempts' : 'Need a hint?'}
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

      {/* Answer form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <div
            className={`
              flex items-center gap-2 px-4 py-3.5 rounded-xl transition-all
              ${shake ? 'animate-bounce' : ''}
            `}
            style={{
              background: lastWrong
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(255,255,255,0.06)',
              border: lastWrong
                ? '1px solid rgba(239,68,68,0.4)'
                : `1px solid ${accentColor}33`,
            }}
          >
            <input
              type="text"
              value={answer}
              onChange={e => { setAnswer(e.target.value); setLastWrong(false) }}
              placeholder="Your answer..."
              className="flex-1 bg-transparent text-white placeholder-white/25 text-base focus:outline-none"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {lastWrong && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
          </div>
          {lastWrong && (
            <p className="text-red-400/80 text-xs mt-1.5 ml-1 animate-fade-in">
              Not quite — try again!
              {attempts >= 2 && ' (Check the hint above)'}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!answer.trim()}
          className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            boxShadow: answer.trim() ? `0 4px 16px ${accentColor}33` : 'none',
          }}
        >
          <Send className="w-4 h-4" />
          Submit Answer
        </button>
      </form>

      {attempts > 0 && !isCompleted && (
        <p className="text-white/25 text-xs text-center">
          {attempts} attempt{attempts !== 1 ? 's' : ''} · Keep going!
        </p>
      )}
    </div>
  )
}
