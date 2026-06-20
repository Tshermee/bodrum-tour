import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetchStops, adminUpsertStop, uploadStopPhoto, deleteStopPhoto, uploadStopAudio, deleteStopAudio } from '../../lib/api'
import { Save, ArrowLeft, Loader2, Upload, Trash2, MapPin, ExternalLink, Music2 } from 'lucide-react'
import MapView from '../../components/ui/MapView'

const TRANSLATION_LANGS = [
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'tr', label: '🇹🇷 TR' },
  { code: 'fr', label: '🇫🇷 FR' },
]

function TranslationSection({ value, onChange, fields }) {
  const [lang, setLang] = useState('de')
  const cur = value[lang] || {}
  function setField(field, v) {
    onChange({ ...value, [lang]: { ...(value[lang] || {}), [field]: v } })
  }
  return (
    <div>
      <div className="flex border-b border-gray-800">
        {TRANSLATION_LANGS.map(l => (
          <button key={l.code} type="button" onClick={() => setLang(l.code)}
            className="flex-1 px-3 py-2.5 text-sm font-medium transition-colors"
            style={lang === l.code
              ? { background: 'rgba(37,99,235,0.12)', color: '#60a5fa', borderBottom: '2px solid #3b82f6' }
              : { color: '#6b7280' }}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
            {f.multiline ? (
              <textarea value={cur[f.key] || ''} onChange={e => setField(f.key, e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 resize-none h-20"
                placeholder={f.placeholder} />
            ) : (
              <input value={cur[f.key] || ''} onChange={e => setField(f.key, e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
                placeholder={f.placeholder} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

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
  challenge_options: '',
  photo_url: '',
  show_photo: false,
  points: 100,
  audio_url: '',
  translations: {},
}

function parseMapsInput(raw) {
  const s = (raw || '').trim()
  if (!s) return null

  function valid(lat, lng) {
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
  }

  // 1. DMS: 37°04'11.9"N 27°14'49.8"E
  //    Handles °/º degrees, '/' ′ minutes, "/"/″ seconds, any NSEW order
  const dmsRx = /(\d+)\s*[°º]\s*(\d+)\s*[''′]\s*([\d.]+)\s*["""″"]\s*([NSEWnsew])/g
  const dmsM = [...s.matchAll(dmsRx)]
  if (dmsM.length >= 2) {
    const toDecimal = (d, m, sec, dir) => {
      const v = parseInt(d) + parseInt(m) / 60 + parseFloat(sec) / 3600
      return 'SW'.includes(dir.toUpperCase()) ? -v : v
    }
    const a = { v: toDecimal(dmsM[0][1], dmsM[0][2], dmsM[0][3], dmsM[0][4]), d: dmsM[0][4].toUpperCase() }
    const b = { v: toDecimal(dmsM[1][1], dmsM[1][2], dmsM[1][3], dmsM[1][4]), d: dmsM[1][4].toUpperCase() }
    if ('NS'.includes(a.d) && 'EW'.includes(b.d)) return valid(a.v, b.v)
    if ('EW'.includes(a.d) && 'NS'.includes(b.d)) return valid(b.v, a.v)
  }

  // 2. Google Maps URL: @lat,lng (standard share link)
  const atM = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (atM) { const r = valid(parseFloat(atM[1]), parseFloat(atM[2])); if (r) return r }

  // 3. Google Maps embed/data: !3dlat!4dlng
  const tdM = s.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
  if (tdM) { const r = valid(parseFloat(tdM[1]), parseFloat(tdM[2])); if (r) return r }

  // 4. ?q=lat,lng or &q=lat,lng or ?query=lat,lng
  const qM = s.match(/[?&](?:q|query)=(-?\d+\.?\d*)[,+%20]+(-?\d+\.?\d*)/)
  if (qM) { const r = valid(parseFloat(qM[1]), parseFloat(qM[2])); if (r) return r }

  // 5. Plain decimal: "37.0700, 27.2472" or "37.0700,27.2472"
  const decM = s.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)
  if (decM) { const r = valid(parseFloat(decM[1]), parseFloat(decM[2])); if (r) return r }

  return null
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
  const [locInput, setLocInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [deletingAudio, setDeletingAudio] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()
  const audioRef = useRef()

  useEffect(() => {
    if (!isNew) {
      adminFetchStops(tourId).then(stops => {
        const stop = stops.find(s => s.id === id)
        if (stop) {
          setForm({ ...EMPTY, ...stop })
          if (stop.photo_url) setPreview(stop.photo_url)
          if (stop.lat && stop.lng) setLocInput(`${stop.lat}, ${stop.lng}`)
        }
      })
    } else {
      // New stop — default the order to the next free slot so stops never collide.
      // order_index is the stop's identity in the app, so duplicates would make
      // completing one stop look like completing several (esp. in free-roam tours).
      adminFetchStops(tourId).then(stops => {
        const maxOrder = stops.reduce((mx, s) => Math.max(mx, s.order_index || 0), 0)
        setForm(prev => ({ ...prev, order_index: maxOrder + 1 }))
      }).catch(() => {})
    }
  }, [id, tourId])

  function handleLocInput(raw) {
    setLocInput(raw)
    const parsed = parseMapsInput(raw)
    if (parsed) {
      set('lat', parsed.lat)
      set('lng', parsed.lng)
    } else {
      // Always clear stale coords — never leave old values when input changes
      set('lat', '')
      set('lng', '')
    }
  }

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

  async function handleDeletePhoto() {
    setError('')
    setDeleting(true)
    try {
      await deleteStopPhoto(form.photo_url)
      set('photo_url', '')
      set('show_photo', false)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError('Could not delete photo: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleAudioChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAudio(true)
    try {
      const tempId = form.id ?? `temp-${Date.now()}`
      const url = await uploadStopAudio(file, tempId)
      set('audio_url', url)
    } catch (err) {
      setError('Audio upload failed: ' + err.message)
    } finally {
      setUploadingAudio(false)
    }
  }

  async function handleDeleteAudio() {
    setDeletingAudio(true)
    try {
      await deleteStopAudio(form.audio_url)
      set('audio_url', '')
      if (audioRef.current) audioRef.current.value = ''
    } catch (err) {
      setError('Could not delete audio: ' + err.message)
    } finally {
      setDeletingAudio(false)
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
        {/* Map + Photo side-by-side */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="grid grid-cols-2" style={{ height: 220 }}>
            {/* Left: map preview */}
            <div className="relative border-r border-gray-800">
              {form.lat && form.lng ? (
                <MapView
                  missions={[{
                    id: 1,
                    coordinates: { lat: Number(form.lat), lng: Number(form.lng) },
                    emoji: '📍',
                  }]}
                  height={220}
                  interactive={false}
                  accentColor="#38bdf8"
                  singleMode={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 bg-gray-800/50">
                  <MapPin className="w-8 h-8 mb-2 opacity-40" />
                  <span className="text-xs text-gray-500">No coordinates yet</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs text-white/60 font-medium"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                Map
              </div>
            </div>

            {/* Right: photo upload */}
            <div className="relative flex flex-col items-center justify-center bg-gray-800/30">
              {preview ? (
                <>
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  {(uploading || deleting) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  {!uploading && !deleting && (
                    <div className="absolute bottom-2 right-2 flex gap-1.5">
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white transition-colors"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                        <Upload className="w-3 h-3" /> Replace
                      </button>
                      <button type="button" onClick={handleDeletePhoto}
                        title="Delete photo"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-300 transition-colors"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-4">
                  <Upload className="w-8 h-8 opacity-40" />
                  <span className="text-xs">Upload stop photo</span>
                  <span className="text-xs text-gray-600">Max 10 MB</span>
                </button>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs text-white/60 font-medium"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                Photo
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </div>
          </div>

          {/* What the player sees for this stop */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-800">
            <span className="text-gray-400 text-sm flex-1">In the app, show</span>
            <div className="flex rounded-xl overflow-hidden border border-gray-700">
              {[
                { val: false, label: 'Map' },
                { val: true, label: 'Photo' },
              ].map(opt => {
                const active = !!form.show_photo === opt.val
                const disabled = opt.val === true && !form.photo_url
                return (
                  <button
                    key={String(opt.val)}
                    type="button"
                    disabled={disabled}
                    onClick={() => set('show_photo', opt.val)}
                    className="px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={active
                      ? { background: '#2563eb', color: '#fff' }
                      : { background: 'transparent', color: '#9ca3af' }}
                  >
                    {opt.label}
                  </button>
                )
              })}
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
            <h2 className="font-semibold text-white">Location</h2>
          </div>
          <Field
            label="Coordinates or Google Maps link"
            hint={`DMS: 37°04'11.9"N 27°14'49.8"E  ·  Decimal: 37.0700, 27.2472  ·  Full Google Maps share URL`}
          >
            <input
              value={locInput}
              onChange={e => handleLocInput(e.target.value)}
              className={inputCls}
              placeholder={`37°04'11.9"N 27°14'49.8"E  or  paste full Google Maps URL`}
            />
          </Field>

          {/* ── Status feedback ── */}
          {form.lat && form.lng ? (
            <div className="space-y-1.5">
              <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {Number(form.lat).toFixed(7)}, {Number(form.lng).toFixed(7)}
              </p>
              <a
                href={`https://maps.google.com/?q=${form.lat},${form.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-3 h-3" /> Verify on Google Maps
              </a>
            </div>
          ) : /goo\.gl|maps\.app/i.test(locInput.trim()) ? (
            <div className="rounded-xl p-3.5 space-y-2"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <p className="text-amber-300 text-xs font-semibold">
                Shortened link — coordinates can't be read directly.
              </p>
              <p className="text-amber-400/70 text-xs leading-relaxed">
                Open the link below, let Google Maps load fully, then copy the full URL from your browser's address bar and paste it back here.
              </p>
              <a
                href={locInput.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open link in new tab →
              </a>
            </div>
          ) : locInput.trim() ? (
            <p className="text-amber-400 text-xs">
              Could not parse — try DMS format, decimal coords, or a full Google Maps URL.
            </p>
          ) : null}
        </div>

        {/* Challenge */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="font-semibold text-white">Challenge</h2>
          <Field label="Challenge Type">
            <select value={form.challenge_type} onChange={e => set('challenge_type', e.target.value)} className={inputCls}>
              <option value="photo">📸  Photo</option>
              <option value="riddle">🔍  Riddle (text answer)</option>
              <option value="code">🔢  Code (numeric / alphanumeric)</option>
              <option value="multiple_choice">🎯  Multiple Choice / True–False</option>
              <option value="image_hunt">🔎  Image Hunt (find & name it)</option>
            </select>
          </Field>
          <Field label="Challenge Prompt" hint="The instruction shown to the user.">
            <textarea value={form.challenge_prompt || ''} onChange={e => set('challenge_prompt', e.target.value)}
              className={`${inputCls} h-20 resize-none`} placeholder="e.g. Take a photo of the castle's reflection in the harbor." />
          </Field>
          {form.challenge_type === 'multiple_choice' && (
            <Field label="Answer Options" hint="One option per line. For True/False just enter True and False.">
              <textarea
                value={form.challenge_options || ''}
                onChange={e => set('challenge_options', e.target.value)}
                className={`${inputCls} h-28 resize-none font-mono`}
                placeholder={'True\nFalse'}
              />
            </Field>
          )}
          {form.challenge_type === 'image_hunt' && (
            <div className="rounded-xl px-4 py-3 text-sm text-sky-300"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
              Upload a close-up photo above — it becomes the visual clue players must find in the real world.
            </div>
          )}
          {form.challenge_type !== 'photo' && (
            <Field
              label={form.challenge_type === 'multiple_choice' ? 'Correct Answer' : 'Answer'}
              hint={
                form.challenge_type === 'multiple_choice'
                  ? 'Must match one of the options above exactly (case-insensitive).'
                  : form.challenge_type === 'riddle' || form.challenge_type === 'image_hunt'
                  ? 'Separate multiple accepted answers with |  e.g.  doorhandle|door handle|doorhandel'
                  : 'Case-insensitive matching applied automatically.'
              }
            >
              <input
                value={form.challenge_answer || ''}
                onChange={e => set('challenge_answer', e.target.value)}
                className={inputCls}
                placeholder={
                  form.challenge_type === 'multiple_choice' ? 'e.g. True' :
                  form.challenge_type === 'riddle' ? 'e.g. mausoleum|mausoleum tomb' :
                  form.challenge_type === 'image_hunt' ? 'e.g. door handle|doorhandle' :
                  'e.g. 1200'
                }
              />
            </Field>
          )}
          <Field label="Hint" hint="Shown after 2 wrong attempts.">
            <input value={form.challenge_hint || ''} onChange={e => set('challenge_hint', e.target.value)} className={inputCls} placeholder="e.g. Think about what this site gave to the English language." />
          </Field>
        </div>

        {/* Audio Guide */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-white">Audio Guide</h2>
          </div>
          <p className="text-gray-500 text-xs -mt-2">Optional audio narration played by the player while walking to this stop.</p>
          {form.audio_url ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Music2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <audio controls src={form.audio_url} className="flex-1 h-8" style={{ filter: 'invert(0.8)' }} />
              {(uploadingAudio || deletingAudio) && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              {!uploadingAudio && !deletingAudio && (
                <button type="button" onClick={handleDeleteAudio}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-300"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => audioRef.current?.click()} disabled={uploadingAudio}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {uploadingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music2 className="w-4 h-4" />}
              {uploadingAudio ? 'Uploading…' : 'Upload audio file (mp3, m4a, wav)'}
            </button>
          )}
          <input ref={audioRef} type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
        </div>

        {/* Translations */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-800">
            <h2 className="font-semibold text-white">Translations</h2>
            <p className="text-gray-500 text-xs mt-0.5">Override stop content per language. Leave blank to use the English version.</p>
          </div>
          <TranslationSection
            value={form.translations || {}}
            onChange={t => set('translations', t)}
            fields={[
              { key: 'name', label: 'Stop Name', placeholder: 'Translated stop name' },
              { key: 'story', label: 'Story', placeholder: 'Translated story text…', multiline: true },
              { key: 'challenge_prompt', label: 'Challenge Prompt', placeholder: 'Translated challenge instruction…', multiline: true },
              { key: 'challenge_hint', label: 'Hint', placeholder: 'Translated hint…' },
            ]}
          />
        </div>

        {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(`/tours/${tourId}/stops`)}
            className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading || deleting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Stop'}
          </button>
        </div>
      </form>
    </div>
  )
}
