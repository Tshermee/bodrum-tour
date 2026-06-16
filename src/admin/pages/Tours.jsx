import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchTours, adminDeleteTour, adminUpsertTour } from '../../lib/api'
import { Plus, Edit2, Trash2, MapPin, Eye, EyeOff, Loader2, ChevronRight } from 'lucide-react'

const DIFF_COLOR = {
  Easy: 'bg-emerald-900/50 text-emerald-400',
  Moderate: 'bg-amber-900/50 text-amber-400',
  Challenging: 'bg-red-900/50 text-red-400',
}

export default function Tours() {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setTours(await adminFetchTours()) } finally { setLoading(false) }
  }

  async function togglePublished(tour) {
    await adminUpsertTour({ ...tour, published: !tour.published })
    setTours(prev => prev.map(t => t.id === tour.id ? { ...t, published: !t.published } : t))
  }

  async function handleDelete(id) {
    if (!confirm('Delete this tour and all its stops? This cannot be undone.')) return
    setDeleting(id)
    try { await adminDeleteTour(id); setTours(prev => prev.filter(t => t.id !== id)) }
    finally { setDeleting(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tours</h1>
          <p className="text-gray-400 mt-1">{tours.length} tour{tours.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/tours/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Tour
        </Link>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {tours.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No tours yet. Create your first one.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {tours.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors">
                {/* Color swatch */}
                <div className="w-10 h-10 rounded-xl flex-shrink-0 border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${t.gradient_from}, ${t.gradient_to})` }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold truncate">{t.name}</span>
                    {!t.published && (
                      <span className="flex-shrink-0 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Draft</span>
                    )}
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
                  <button onClick={() => togglePublished(t)}
                    title={t.published ? 'Unpublish' : 'Publish'}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                    {t.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <Link to={`/tours/${t.id}/stops`}
                    title="Manage stops"
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <MapPin className="w-4 h-4" />
                  </Link>

                  <Link to={`/tours/${t.id}/edit`}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </Link>

                  <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
                    {deleting === t.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>

                  <Link to={`/tours/${t.id}/stops`}
                    className="flex items-center gap-1 ml-2 text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Stops <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
