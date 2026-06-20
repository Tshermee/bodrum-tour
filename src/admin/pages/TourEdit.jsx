import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetchTours, adminUpsertTour, uploadTourCover, deleteStopPhoto } from '../../lib/api'
import { Save, ArrowLeft, Loader2, Copy, Check, MapPin, Upload, Trash2, ChevronDown } from 'lucide-react'

const ALL_TAGS = [
  { id: 'history', label: '🏛️ History' },
  { id: 'food', label: '🍽️ Food' },
  { id: 'photography', label: '📸 Photography' },
  { id: 'nature', label: '🌿 Nature' },
  { id: 'active', label: '🏃 Active' },
  { id: 'culture', label: '🏺 Culture' },
  { id: 'scenic', label: '🏔️ Scenic' },
  { id: 'architecture', label: '🏗️ Architecture' },
]

const TRANSLATION_LANGS = [
  { code: 'tr', label: 'Turkish', flag: '🇹🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
]

function TranslationSection({ value, onChange, fields }) {
  const [openLang, setOpenLang] = useState(null)

  function setField(lang, key, v) {
    const langData = { ...(value[lang] || {}) }
    if (v === '') {
      delete langData[key]
    } else {
      langData[key] = v
    }
    if (Object.keys(langData).length === 0) {
      const next = { ...value }
      delete next[lang]
      onChange(next)
    } else {
      onChange({ ...value, [lang]: langData })
    }
  }

  return (
    <div className="divide-y divide-gray-800">
      {TRANSLATION_LANGS.map(lang => {
        const isOpen = openLang === lang.code
        const hasData = value[lang.code] && Object.values(value[lang.code]).some(v => v && v.trim())
        return (
          <div key={lang.code}>
            <button
              type="button"
              onClick={() => setOpenLang(isOpen ? null : lang.code)}
              className="w-full flex items-center gap-3 px-6 py-3.5 text-left hover:bg-gray-800/40 transition-colors"
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span className="text-sm font-medium text-gray-300 flex-1">{lang.label}</span>
              {hasData && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
                  translated
                </span>
              )}
              <ChevronDown
                className="w-4 h-4 text-gray-500 transition-transform"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-5 pt-1 space-y-3 bg-gray-800/20">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
                    {f.multiline ? (
                      <textarea
                        value={(value[lang.code] || {})[f.key] || ''}
                        onChange={e => setField(lang.code, f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 h-20 resize-none text-sm"
                      />
                    ) : (
                      <input
                        value={(value[lang.code] || {})[f.key] || ''}
                        onChange={e => setField(lang.code, f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const EMPTY = {
  id: '', name: '', subtitle: '', description: '',
  duration_min: '1', duration_max: '2', difficulty: 'Moderate',
  tour_type: 'sequential',
  price: 0, max_score: 0,
  gradient_from: '#1e3a8a', gradient_to: '#0e7490', accent_color: '#38bdf8',
  tags: [], kid_friendly: false, published: true, bypass_gps: false,
  cover_image_url: '', show_cover_image: false,
  translations: {},
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const coverRef = useRef()

  function copyPreviewLink() {
    const url = `${window.location.origin}${window.location.pathname.replace(/\/admin.*/, '')}?preview=${form.preview_token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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

  async function handleCoverChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!form.id.trim()) { setError('Enter a Tour ID before uploading a cover image.'); return }
    setError('')
    setUploading(true)
    try {
      const url = await uploadTourCover(file, form.id.trim())
      set('cover_image_url', url)
    } catch (err) {
      setError('Cover upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteCover() {
    setError('')
    setDeleting(true)
    try {
      await deleteStopPhoto(form.cover_image_url)
      set('cover_image_url', '')
      set('show_cover_image', false)
      if (coverRef.current) coverRef.current.value = ''
    } catch (err) {
      setError('Could not delete cover image: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  function toggleTag(tagId) {
    set('tags', form.tags.includes(tagId)
      ? form.tags.filter(t => t !== tagId)
      : [...form.tags, tagId]
    )
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

        {/* Cover image */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="font-semibold text-white">Cover Image</h2>

          <div className="relative rounded-xl overflow-hidden bg-gray-800/40" style={{ height: 200 }}>
            {form.cover_image_url ? (
              <>
                <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
                {(uploading || deleting) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                {!uploading && !deleting && (
                  <div className="absolute bottom-2 right-2 flex gap-1.5">
                    <button type="button" onClick={() => coverRef.current?.click()}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                      <Upload className="w-3 h-3" /> Replace
                    </button>
                    <button type="button" onClick={handleDeleteCover} title="Delete cover image"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-300"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button type="button" onClick={() => coverRef.current?.click()} disabled={uploading}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-colors">
                {uploading
                  ? <Loader2 className="w-7 h-7 animate-spin" />
                  : <Upload className="w-8 h-8 opacity-40" />}
                <span className="text-xs">Upload cover image</span>
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </div>

          {/* What the player sees on the tour card */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm flex-1">On the tour card, show</span>
            <div className="flex rounded-xl overflow-hidden border border-gray-700">
              {[
                { val: false, label: 'Map' },
                { val: true, label: 'Image' },
              ].map(opt => {
                const active = !!form.show_cover_image === opt.val
                const disabled = opt.val === true && !form.cover_image_url
                return (
                  <button key={String(opt.val)} type="button" disabled={disabled}
                    onClick={() => set('show_cover_image', opt.val)}
                    className="px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={active ? { background: '#2563eb', color: '#fff' } : { background: 'transparent', color: '#9ca3af' }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tour Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'sequential', icon: '🧭', label: 'Sequential', desc: 'Fixed route — one stop unlocks the next, in order.' },
                { val: 'free_roam', icon: '🗺️', label: 'Free Roam', desc: 'All stops open — players pick any stop, in any order.' },
              ].map(opt => {
                const active = (form.tour_type || 'sequential') === opt.val
                return (
                  <button key={opt.val} type="button" onClick={() => set('tour_type', opt.val)}
                    className="text-left px-3.5 py-3 rounded-xl transition-colors"
                    style={active
                      ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)' }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base leading-none">{opt.icon}</span>
                      <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>{opt.label}</span>
                    </div>
                    <p className="text-gray-500 text-xs leading-snug">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_TAGS.map(tag => (
                <label key={tag.id} className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl transition-colors"
                  style={form.tags.includes(tag.id)
                    ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <input type="checkbox" checked={form.tags.includes(tag.id)} onChange={() => toggleTag(tag.id)}
                    className="w-4 h-4 rounded accent-blue-500 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{tag.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl transition-colors"
              style={form.kid_friendly
                ? { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <input type="checkbox" checked={form.kid_friendly} onChange={e => set('kid_friendly', e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-400 flex-shrink-0" />
              <span className="text-gray-300 text-sm">👶 Kid-friendly</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl transition-colors"
              style={form.published
                ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)}
                className="w-4 h-4 rounded accent-green-500 flex-shrink-0" />
              <span className="text-gray-300 text-sm">🌐 Published</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl transition-colors"
              style={form.bypass_gps
                ? { background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <input type="checkbox" checked={form.bypass_gps || false} onChange={e => set('bypass_gps', e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-500 flex-shrink-0" />
              <span className="text-gray-300 text-sm">🧪 Bypass GPS</span>
            </label>
          </div>

          {/* Test link */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Test link</p>
            <p className="text-gray-500 text-xs">Share this URL to let testers access this tour even when unpublished.</p>
            {!isNew && form.preview_token ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-gray-300 bg-gray-800 rounded-lg px-3 py-2 truncate">
                  {`${window.location.origin}${window.location.pathname.replace(/\/admin.*/, '')}?preview=${form.preview_token}`}
                </code>
                <button
                  type="button"
                  onClick={copyPreviewLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                  style={copied
                    ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <p className="text-gray-600 text-xs italic">Save the tour first to generate a test link.</p>
            )}
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

        {/* Translations */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-800">
            <h2 className="font-semibold text-white">Translations</h2>
            <p className="text-gray-500 text-xs mt-0.5">Override tour content per language. Leave blank to use the English version.</p>
          </div>
          <TranslationSection
            value={form.translations || {}}
            onChange={t => set('translations', t)}
            fields={[
              { key: 'name', label: 'Tour Name', placeholder: 'Translated tour name' },
              { key: 'subtitle', label: 'Subtitle', placeholder: 'Translated tagline' },
              { key: 'description', label: 'Description', placeholder: 'Translated description…', multiline: true },
            ]}
          />
        </div>

        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>}

        <div className="flex items-center justify-between gap-3">
          <div>
            {!isNew && (
              <button type="button" onClick={() => navigate(`/tours/${id}/stops`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-300 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MapPin className="w-4 h-4" />
                Edit Stops
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/tours')}
              className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading || deleting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Tour'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
