import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetchStops, adminUpsertStop, uploadStopPhoto } from '../../lib/api'
import { Save, ArrowLeft, Loader2, Upload, X, MapPin } from 'lucide-react'

const EMPTY = {
  id: undefined,
  tour_id: '',
  order_index: 1,
  name: '',
  story: '',
  location_name: '',
  lat: '',
  lng: '',
  challenge_type: 'photo',
  challenge_answer: '',
  challenge_hint: '',
  challenge_prompt: '',
  photo_url: '',
  points: 100,
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

export default function StopEdit() {
  const { tourId, id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const [form, setForm] = useState({ ...EMPTY, tour_id: tourId })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    if (!isNew) {
      adminFetchStops(tourId).then(stops => {
        const stop = stops.find(s => s.id === id)
        if (stop) {
          setForm({ ...EMPTY, ...stop })
          if (stop.photo_url) setPreview(stop.photo_url)
        }
      })
    }
  }, [id, tourId])

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const tempId = form.id ?? `temp-${Date.now()}`
      const url = await uploadStopPhoto(file, tempId)
      set('photo_url', url)
    } catch (err) {
      setError('Photo upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        lat: form.lat !== '' ? parseFloat(form.lat) : null,
        lng: form.lng !== '' ? parseFloat(form.lng) : null,
        points: parseInt(form.points),
        order_index: parseInt(form.order_index),
      }
      if (isNew) delete payload.id
      await adminUpsertStop(payload)
      navigate(`/tours/${tourId}/stops`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/tours/${tourId}/stops`)}
          className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isNew ? 'New Stop' : 'Edit Stop'}</h1>
          <p className="text-gray-400 mt-0.5 text-sm font-mono">{tourId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="font-semibold text-white">Stop Photo</h2>
          <div className="flex gap-4 items-start">
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0 relative">
              {preview ? (
                <>
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <Upload className="w-8 h-8 mb-1" />
                  <span className="text-xs">No photo</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors">
                <Upload className="w-4 h-4" /> Upload Photo
              </button>
              {preview && (
                <button type="button" onClick={() => { setPreview(null); set('photo_url', '') }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm">
                  <X className="w-4 h-4" /> Remove
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <p className="text-gray-500 text-xs">Shown to users at this stop. Max 10MB.</p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="font-semibold text-white">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Order">
              <input type="number" min="1" value={form.order_index} onChange={e => set('order_index', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Points">
              <input type="number" min="0" value={form.points} onChange={e => set('points', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Stop Name">
            <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Guardian of the Aegean" required />
          </Field>
          <Field label="Location Name">
            <input value={form.location_name || ''} onChange={e => set('location_name', e.target.value)} className={inputCls} placeholder="e.g. Bodrum Castle" />
          </Field>
          <Field label="Story / Description">
            <textarea value={form.story || ''} onChange={e => set('story', e.target.value)}
              className={`${inputCls} h-24 resize-none`} placeholder="The story shown to users at this stop…" />
          </Field>
        </div>

        {/* Location */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-white">GPS Coordinates</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" hint="e.g. 37.0340">
              <input value={form.lat || ''} onChange={e => set('lat', e.target.value)} className={inputCls} placeholder="37.0340" />
            </Field>
            <Field label="Longitude" hint="e.g. 27.4277">
              <input value={form.lng || ''} onChange={e => set('lng', e.target.value)} className={inputCls} placeholder="27.4277" />
            </Field>
          </div>
        </div>

        {/* Challenge */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="font-semibold text-white">Challenge</h2>
          <Field label="Challenge Type">
            <select value={form.challenge_type} onChange={e => set('challenge_type', e.target.value)} className={inputCls}>
              <option value="photo">Photo</option>
              <option value="riddle">Riddle (text answer)</option>
              <option value="code">Code (numeric/alphanumeric)</option>
            </select>
          </Field>
          <Field label="Challenge Prompt" hint="The instruction shown to the user.">
            <textarea value={form.challenge_prompt || ''} onChange={e => set('challenge_prompt', e.target.value)}
              className={`${inputCls} h-20 resize-none`} placeholder="e.g. Take a photo of the castle's reflection in the harbor." />
          </Field>
          {form.challenge_type !== 'photo' && (
            <Field label="Answer" hint="Exact answer (case-insensitive matching applied automatically).">
              <input value={form.challenge_answer || ''} onChange={e => set('challenge_answer', e.target.value)} className={inputCls} placeholder="e.g. mausoleum" />
            </Field>
          )}
          <Field label="Hint" hint="Shown after 2 wrong attempts.">
            <input value={form.challenge_hint || ''} onChange={e => set('challenge_hint', e.target.value)} className={inputCls} placeholder="e.g. Think about what this site gave to the English language." />
          </Field>
        </div>

        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(`/tours/${tourId}/stops`)}
            className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Stop'}
          </button>
        </div>
      </form>
    </div>
  )
}
