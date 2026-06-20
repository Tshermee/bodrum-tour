import { useState, useEffect } from 'react'
import { fetchAppConfig, adminSaveAppConfig } from '../../lib/api'
import { Save, Loader2, Globe } from 'lucide-react'

const LANGS = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'tr', label: '🇹🇷 Turkish' },
  { code: 'fr', label: '🇫🇷 French' },
]

// The four rules shown in the player's "How to play" dialog. The emojis are fixed
// in the app; the admin edits the title + body text. rule1 is the "walk to each
// stop" rule (sequential tours) — free-roam tours keep their own built-in default
// unless overridden here.
const RULE_SLOTS = [
  { key: 'rule1', emoji: '📍', label: 'Rule 1 — Walk / explore' },
  { key: 'rule2', emoji: '📸', label: 'Rule 2 — Complete the challenge' },
  { key: 'rule3', emoji: '💡', label: 'Rule 3 — Hints cost points' },
  { key: 'rule4', emoji: '⏭️', label: 'Rule 4 — Skipping' },
]

const EMPTY_LANG = {
  heading: '',
  rule1_title: '', rule1_body: '',
  rule2_title: '', rule2_body: '',
  rule3_title: '', rule3_body: '',
  rule4_title: '', rule4_body: '',
  start_label: '',
}

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
    </div>
  )
}

export default function RulesConfig() {
  const [data, setData] = useState({ en: { ...EMPTY_LANG }, de: { ...EMPTY_LANG }, tr: { ...EMPTY_LANG }, fr: { ...EMPTY_LANG } })
  const [activeLang, setActiveLang] = useState('en')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAppConfig('rules').then(cfg => {
      if (cfg) setData(prev => ({ ...prev, ...cfg }))
    }).catch(() => {})
  }, [])

  function set(field, value) {
    setData(prev => ({
      ...prev,
      [activeLang]: { ...(prev[activeLang] || EMPTY_LANG), [field]: value }
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await adminSaveAppConfig('rules', data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const cur = data[activeLang] || EMPTY_LANG

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Game Rules</h1>
        <p className="text-gray-400 mt-0.5 text-sm">Edit the "How to play" dialog shown when a player starts a tour. Leave blank to use the built-in translation.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex border-b border-gray-800">
            {LANGS.map(l => (
              <button
                key={l.code}
                type="button"
                onClick={() => setActiveLang(l.code)}
                className="flex-1 px-3 py-3 text-sm font-medium transition-colors"
                style={activeLang === l.code
                  ? { background: 'rgba(37,99,235,0.15)', color: '#60a5fa', borderBottom: '2px solid #3b82f6' }
                  : { color: '#6b7280' }}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Globe className="w-3.5 h-3.5" />
              {activeLang === 'en' ? 'Base content — shown when no other language matches.' : 'Override — shown when the app language is set to this language.'}
            </div>

            <Field label="Dialog heading" hint='e.g. "How to play"'>
              <input value={cur.heading || ''} onChange={e => set('heading', e.target.value)} className={inputCls} placeholder="How to play" />
            </Field>

            {RULE_SLOTS.map(slot => (
              <div key={slot.key} className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                  <span className="text-base leading-none">{slot.emoji}</span> {slot.label}
                </div>
                <Field label="Title">
                  <input value={cur[`${slot.key}_title`] || ''} onChange={e => set(`${slot.key}_title`, e.target.value)} className={inputCls} placeholder="Short title" />
                </Field>
                <Field label="Body">
                  <textarea value={cur[`${slot.key}_body`] || ''} onChange={e => set(`${slot.key}_body`, e.target.value)}
                    className={`${inputCls} h-20 resize-none`} placeholder="Explanation shown under the title…" />
                </Field>
              </div>
            ))}

            <Field label="Start button label" hint={`e.g. "Let's go! 🚀"`}>
              <input value={cur.start_label || ''} onChange={e => set('start_label', e.target.value)} className={inputCls} placeholder="Let's go! 🚀" />
            </Field>
          </div>
        </div>

        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>}

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Game Rules'}
          </button>
        </div>
      </form>
    </div>
  )
}
