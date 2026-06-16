import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetchTours, adminUpsertTour } from '../../lib/api'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'

const EMPTY = {
  id: '', name: '', subtitle: '', description: '',
  duration_min: '1', duration_max: '2', difficulty: 'Moderate',
  price: 0, max_score: 0,
  gradient_from: '#1e3a8a', gradient_to: '#0e7490', accent_color: '#38bdf8',
  tags: [], kid_friendly: false, published: true,
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"

export default function TourEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [form, setForm] = useState(EMPTY)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew) {
      adminFetchTours().then(tours => {
        const tour = tours.find(t => t.id === id)
        if (tour) setForm({ ...EMPTY, ...tour })
      })
    }
  }, [id])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  function removeTag(tag) {
    set('tags', form.tags.filter(t => t !== tag))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.id.trim() || !form.name.trim()) { setError('ID and Name are required.'); return }
    setSaving(true)
    try {
      await adminUpsertTour(form)
      navigate('/tours')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tours')} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isNew ? 'New Tour' : 'Edit Tour'}</h1>
          <p className="text-gray-400 mt-0.5 text-sm">{isNew ? 'Create a new tour' : `Editing: ${form.name}`}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <h2 className="font-semibold text-white">Basic Info</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tour ID" hint="Lowercase, hyphens only. Cannot change after saving.">
              <input value={form.id} onChange={e => set('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className={inputCls} placeholder="my-tour-id" disabled={!isNew} required />
            </Field>
            <Field label="Price (€)">
              <input type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', parseFloat(e.target.value))}
                className={inputCls} />
            </Field>
          </div>

          <Field label="Name">
            <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Tour name" required />
          </Field>

          <Field label="Subtitle">
            <input value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)} className={inputCls} placeholder="A short tagline" />
          </Field>

          <Field label="Description">
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
              className={`${inputCls} h-24 resize-none`} placeholder="Full tour description..." />
          </Field>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <h2 className="font-semibold text-white">Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Duration min (h)">
              <input value={form.duration_min} onChange={e => set('duration_min', e.target.value)} className={inputCls} placeholder="1" />
            </Field>
            <Field label="Duration max (h)">
              <input value={form.duration_max} onChange={e => set('duration_max', e.target.value)} className={inputCls} placeholder="2" />
            </Field>
            <Field label="Max Score">
              <input type="number" value={form.max_score} onChange={e => set('max_score', parseInt(e.target.value))} className={inputCls} />
            </Field>
          </div>

          <Field label="Difficulty">
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={inputCls}>
              <option>Easy</option>
              <option>Moderate</option>
              <option>Challenging</option>
            </select>
          </Field>

          <Field label="Tags" hint="Press Enter or comma to add">
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-blue-900/40 text-blue-300 rounded-lg px-2 py-1 text-xs">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-blue-400 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              className={inputCls} placeholder="history, culture, food…" />
          </Field>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.kid_friendly} onChange={e => set('kid_friendly', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-gray-300 text-sm">Kid-friendly</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer ml-6">
              <input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-gray-300 text-sm">Published</span>
            </label>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <h2 className="font-semibold text-white">Colors</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Gradient From', field: 'gradient_from' },
              { label: 'Gradient To', field: 'gradient_to' },
              { label: 'Accent Color', field: 'accent_color' },
            ].map(({ label, field }) => (
              <Field key={field} label={label}>
                <div className="flex items-center gap-2">
                  <input type="color" value={form[field]} onChange={e => set(field, e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <input value={form[field]} onChange={e => set(field, e.target.value)} className={`${inputCls} flex-1`} />
                </div>
              </Field>
            ))}
          </div>
          <div className="rounded-xl h-16 border border-white/10"
            style={{ background: `linear-gradient(135deg, ${form.gradient_from}, ${form.gradient_to})` }} />
        </div>

        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/tours')}
            className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Tour'}
          </button>
        </div>
      </form>
    </div>
  )
}
