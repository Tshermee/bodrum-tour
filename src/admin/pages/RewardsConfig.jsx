import { useState, useEffect } from 'react'
import { fetchAppConfig, adminSaveAppConfig } from '../../lib/api'
import { DEFAULT_REWARDS, REWARD_LANGS } from '../../lib/rewards'
import { Save, Loader2, Plus, Trash2, Globe } from 'lucide-react'

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"

function newId() {
  try { return crypto.randomUUID().slice(0, 8) } catch { return `r${Math.floor(performance.now())}` }
}

function blankReward() {
  return { id: newId(), emoji: '🎁', points: 100, code: '', link: '', title: {}, desc: {} }
}

export default function RewardsConfig() {
  const [items, setItems] = useState(DEFAULT_REWARDS.map(r => ({ ...r })))
  const [activeLang, setActiveLang] = useState('en')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAppConfig('rewards').then(cfg => {
      if (Array.isArray(cfg?.items) && cfg.items.length) setItems(cfg.items.map(r => ({ ...r })))
    }).catch(() => {})
  }, [])

  function update(idx, patch) {
    setItems(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }
  function updateLang(idx, field, value) {
    setItems(prev => prev.map((r, i) => {
      if (i !== idx) return r
      const next = { ...(r[field] || {}) }
      if (value === '') delete next[activeLang]; else next[activeLang] = value
      return { ...r, [field]: next }
    }))
  }
  function addReward() { setItems(prev => [...prev, blankReward()]) }
  function removeReward(idx) { setItems(prev => prev.filter((_, i) => i !== idx)) }
  function move(idx, dir) {
    setItems(prev => {
      const arr = [...prev]
      const j = dir === 'up' ? idx - 1 : idx + 1
      if (j < 0 || j >= arr.length) return prev
      ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
      return arr
    })
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      // Normalise points to numbers and ids to present
      const clean = items.map(r => ({ ...r, id: r.id || newId(), points: Number(r.points) || 0 }))
      await adminSaveAppConfig('rewards', { items: clean })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Redeem Rewards</h1>
        <p className="text-gray-400 mt-0.5 text-sm">Rewards players can redeem with their points. Title & description are per language; emoji, points, code and link are shared.</p>
      </div>

      {/* Language tabs (title/description) */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex border-b border-gray-800">
          {REWARD_LANGS.map(l => (
            <button key={l.code} type="button" onClick={() => setActiveLang(l.code)}
              className="flex-1 px-3 py-3 text-sm font-medium transition-colors"
              style={activeLang === l.code
                ? { background: 'rgba(37,99,235,0.15)', color: '#60a5fa', borderBottom: '2px solid #3b82f6' }
                : { color: '#6b7280' }}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-500">
          <Globe className="w-3.5 h-3.5" />
          {activeLang === 'en' ? 'Base content — shown when no other language matches.' : 'Override — shown when the app language is set to this language.'}
        </div>
      </div>

      {/* Reward cards */}
      <div className="space-y-3">
        {items.map((r, idx) => (
          <div key={r.id || idx} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1 pt-1 text-gray-600">
                <button type="button" onClick={() => move(idx, 'up')} disabled={idx === 0} className="hover:text-gray-300 disabled:opacity-20 text-xs">▲</button>
                <button type="button" onClick={() => move(idx, 'down')} disabled={idx === items.length - 1} className="hover:text-gray-300 disabled:opacity-20 text-xs">▼</button>
              </div>

              <div className="flex-1 space-y-3">
                {/* Shared: emoji + points */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">Emoji</label>
                    <input value={r.emoji || ''} onChange={e => update(idx, { emoji: e.target.value })} className={`${inputCls} text-center`} maxLength={4} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">Points</label>
                    <input type="number" min="0" value={r.points} onChange={e => update(idx, { points: e.target.value })} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">Title ({activeLang})</label>
                    <input value={(r.title || {})[activeLang] || ''} onChange={e => updateLang(idx, 'title', e.target.value)} className={inputCls} placeholder="Free Coffee" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">Description ({activeLang})</label>
                  <input value={(r.desc || {})[activeLang] || ''} onChange={e => updateLang(idx, 'desc', e.target.value)} className={inputCls} placeholder="One free coffee at any partner café" />
                </div>

                {/* Shared: code + link */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">Code <span className="text-gray-600">(optional)</span></label>
                    <input value={r.code || ''} onChange={e => update(idx, { code: e.target.value })} className={inputCls} placeholder="Auto-generated if blank" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">Link <span className="text-gray-600">(optional)</span></label>
                    <input value={r.link || ''} onChange={e => update(idx, { link: e.target.value })} className={inputCls} placeholder="https://…" />
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => removeReward(idx)}
                className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addReward}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Plus className="w-4 h-4" /> Add reward
      </button>

      {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Rewards'}
        </button>
      </div>
    </div>
  )
}
