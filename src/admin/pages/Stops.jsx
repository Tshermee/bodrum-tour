import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { adminFetchStops, adminDeleteStop, adminUpsertStop } from '../../lib/api'
import { Plus, Edit2, Trash2, ArrowLeft, Loader2, GripVertical, Camera, FileText, Hash, CheckSquare, Eye } from 'lucide-react'

const TYPE_ICON = { photo: Camera, riddle: FileText, code: Hash, multiple_choice: CheckSquare, image_hunt: Eye }
const TYPE_COLOR = { photo: 'text-purple-400', riddle: 'text-amber-400', code: 'text-cyan-400', multiple_choice: 'text-green-400', image_hunt: 'text-sky-400' }

export default function Stops() {
  const { tourId } = useParams()
  const navigate = useNavigate()
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { load() }, [tourId])

  async function load() {
    setLoading(true)
    try { setStops(await adminFetchStops(tourId)) } finally { setLoading(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this stop?')) return
    setDeleting(id)
    try { await adminDeleteStop(id); setStops(prev => prev.filter(s => s.id !== id)) }
    finally { setDeleting(null) }
  }

  async function moveStop(idx, dir) {
    const arr = [...stops]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    const updated = arr.map((s, i) => ({ ...s, order_index: i + 1 }))
    setStops(updated)
    await Promise.all(updated.map(s => adminUpsertStop(s)))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tours')} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Stops</h1>
            <p className="text-gray-400 mt-0.5 text-sm font-mono">{tourId}</p>
          </div>
        </div>
        <Link to={`/tours/${tourId}/stops/new`}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Stop
        </Link>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {stops.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No stops yet. Add the first one.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {stops.map((stop, idx) => {
              const Icon = TYPE_ICON[stop.challenge_type] ?? FileText
              return (
                <div key={stop.id} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col gap-1 text-gray-600">
                    <button onClick={() => moveStop(idx, 'up')} disabled={idx === 0} className="hover:text-gray-300 disabled:opacity-20 text-xs">▲</button>
                    <button onClick={() => moveStop(idx, 'down')} disabled={idx === stops.length - 1} className="hover:text-gray-300 disabled:opacity-20 text-xs">▼</button>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300 flex-shrink-0">
                    {stop.order_index}
                  </div>

                  {stop.photo_url ? (
                    <img src={stop.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-5 h-5 ${TYPE_COLOR[stop.challenge_type]}`} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{stop.name}</p>
                    <p className="text-gray-400 text-sm truncate">{stop.location_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs ${TYPE_COLOR[stop.challenge_type]}`}>{stop.challenge_type}</span>
                      <span className="text-gray-500 text-xs">{stop.points} pts</span>
                      {stop.lat && <span className="text-gray-600 text-xs">{Number(stop.lat).toFixed(4)}, {Number(stop.lng).toFixed(4)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/tours/${tourId}/stops/${stop.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(stop.id)} disabled={deleting === stop.id}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
                      {deleting === stop.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
