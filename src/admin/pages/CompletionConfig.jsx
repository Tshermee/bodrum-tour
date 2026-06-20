import { useState, useEffect } from 'react'
import { fetchAppConfig, adminSaveAppConfig } from '../../lib/api'
import { Save, Loader2, Globe } from 'lucide-react'

const LANGS = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'tr', label: '🇹🇷 Turkish' },
  { code: 'fr', label: '🇫🇷 French' },
]

const EMPTY_LANG = { heading_main: '', heading_sub: '', message: '' }

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

export default function CompletionConfig() {
  const [data, setData] = useState({ en: { ...EMPTY_LANG }, de: { ...EMPTY_LANG }, tr: { ...EMPTY_LANG }, fr: { ...EMPTY_LANG } })
  const [activeLang, setActiveLang] = useState('en')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAppConfig('completion').then(cfg => {
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
      await adminSaveAppConfig('completion', data)
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
        <h1 className="text-2xl font-bold text-white">Mission Complete Screen</h1>
        <p className="text-gray-400 mt-0.5 text-sm">Edit the results screen shown when a player finishes a tour. Leave blank to use the built-in translation.</p>
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

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Globe className="w-3.5 h-3.5" />
              {activeLang === 'en' ? 'Base content — shown when no other language matches.' : 'Override — shown when the app language is set to this language.'}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Heading (main)" hint='e.g. "Tour"'>
                <input value={cur.heading_main || ''} onChange={e => set('heading_main', e.target.value)} className={inputCls} placeholder="Tour" />
              </Field>
              <Field label="Heading (sub)" hint='e.g. "Complete!"'>
                <input value={cur.heading_sub || ''} onChange={e => set('heading_sub', e.target.value)} className={inputCls} placeholder="Complete!" />
              </Field>
            </div>

            <Field label="Message" hint="Optional congratulatory line. Leave blank to show the default '{name} finished {tour}'.">
              <textarea value={cur.message || ''} onChange={e => set('message', e.target.value)}
                className={`${inputCls} h-24 resize-none`}
                placeholder="Thanks for exploring Bodrum with us — show this screen at any partner café for a treat!" />
            </Field>
          </div>
        </div>

        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>}

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Completion Screen'}
          </button>
        </div>
      </form>
    </div>
  )
}
