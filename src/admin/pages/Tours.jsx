import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchTours, adminDeleteTour, adminUpsertTour, adminDuplicateTour } from '../../lib/api'
import { Plus, Edit2, Trash2, MapPin, Eye, EyeOff, Loader2, ChevronRight, ChevronUp, ChevronDown, Copy } from 'lucide-react'

const DIFF_COLOR = {
  Easy: 'bg-emerald-900/50 text-emerald-400',
  Moderate: 'bg-amber-900/50 text-amber-400',
  Challenging: 'bg-red-900/50 text-red-400',
}

export default function Tours() {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [moving, setMoving] = useState(null)
  const [duplicating, setDuplicating] = useState(null)
  const [toastError, setToastError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setTours(await adminFetchTours()) } finally { setLoading(false) }
  }

  async function togglePublished(tour) {
    setToggling(tour.id)
    try {
      await adminUpsertTour({ ...tour, published: !tour.published })
      setTours(prev => prev.map(t => t.id === tour.id ? { ...t, published: !t.published } : t))
    } catch (err) {
      setToastError(err.message)
      setTimeout(() => setToastError(''), 5000)
    } finally {
      setToggling(null)
    }
  }

  async function handleDuplicate(id) {
    setDuplicating(id)
    try {
      const newTour = await adminDuplicateTour(id)
      setTours(prev => [...prev, { ...newTour, tour_stops: [{ count: 0 }] }])
    } catch (err) {
      setToastError(err.message)
      setTimeout(() => setToastError(''), 5000)
    } finally {
      setDuplicating(null)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this tour and all its stops? This cannot be undone.')) return
    setDeleting(id)
    try { await adminDeleteTour(id); setTours(prev => prev.filter(t => t.id !== id)) }
    finally { setDeleting(null) }
  }

  async function handleMove(tourId, direction) {
    const idx = tours.findIndex(t => t.id === tourId)
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= tours.length) return

    // Swap positions in array
    const reordered = [...tours]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]

    // Assign clean sequential sort_orders (10, 20, 30…)
    const updated = reordered.map((t, i) => ({ ...t, sort_order: (i + 1) * 10 }))

    // Track which two actually changed
    const prevOrders = new Map(tours.map(t => [t.id, t.sort_order]))
    const changed = updated.filter(t => t.sort_order !== prevOrders.get(t.id))

    setMoving(tourId)
    setTours(updated)
    try {
      await Promise.all(changed.map(t => adminUpsertTour(t)))
    } catch (err) {
      setTours(tours) // revert
      setToastError(err.message)
      setTimeout(() => setToastError(''), 5000)
    } finally {
      setMoving(null)
    }
  }

  const published = tours.filter(t => t.published)
  const drafts = tours.filter(t => !t.published)

  function TourRow({ t }) {
    const idx = tours.findIndex(tour => tour.id === t.id)
    return (
      <div key={t.id} className="flex items-center gap-3 px-4 py-4 hover:bg-gray-800/50 transition-colors">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={() => handleMove(t.id, 'up')}
            disabled={idx === 0 || moving != null}
            title="Move up"
            className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleMove(t.id, 'down')}
            disabled={idx === tours.length - 1 || moving != null}
            title="Move down"
            className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-gray-600 text-xs font-mono w-5 text-center flex-shrink-0">{idx + 1}</span>

        <div className="w-10 h-10 rounded-xl flex-shrink-0 border border-white/10"
          style={{ background: `linear-gradient(135deg, ${t.gradient_from}, ${t.gradient_to})` }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold truncate">{t.name}</span>
            {moving === t.id && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLOR[t.difficulty] ?? 'text-gray-400'}`}>
              {t.difficulty}
            </span>
            <span className="text-gray-500 text-xs">€{Number(t.price).toFixed(0)}</span>
            <span className="text-gray-500 text-xs">{t.tour_stops?.[0]?.count ?? 0} stops</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => togglePublished(t)} disabled={toggling === t.id}
            title={t.published ? 'Unpublish' : 'Publish'}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
            {toggling === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <Link to={`/tours/${t.id}/stops`} title="Manage stops"
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
            <MapPin className="w-4 h-4" />
          </Link>
          <Link to={`/tours/${t.id}/edit`}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Edit2 className="w-4 h-4" />
          </Link>
          <button onClick={() => handleDuplicate(t.id)} disabled={duplicating === t.id} title="Duplicate tour"
            className="p-2 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
            {duplicating === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
            {deleting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
          <Link to={`/tours/${t.id}/stops`}
            className="flex items-center gap-1 ml-2 text-blue-400 hover:text-blue-300 text-sm font-medium">
            Stops <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {toastError && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{toastError}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tours</h1>
          <p className="text-gray-400 mt-1">
            <span className="text-emerald-400">{published.length} live</span>
            <span className="text-gray-600 mx-1.5">·</span>
            <span className="text-gray-500">{drafts.length} hidden</span>
          </p>
        </div>
        <Link to="/tours/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Tour
        </Link>
      </div>

      {/* Live tours */}
      <div className="bg-gray-900 rounded-2xl border border-emerald-900/50 overflow-hidden">
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-emerald-900/40"
          style={{ background: 'rgba(34,197,94,0.06)' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Live · {published.length}</span>
        </div>
        {published.length === 0 ? (
          <div className="py-10 text-center text-gray-600 text-sm">No published tours yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {published.map(t => <TourRow key={t.id} t={t} />)}
          </div>
        )}
      </div>

      {/* Hidden / draft tours */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-800"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Hidden · {drafts.length}</span>
        </div>
        {drafts.length === 0 ? (
          <div className="py-10 text-center text-gray-600 text-sm">No hidden tours.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {drafts.map(t => <TourRow key={t.id} t={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
