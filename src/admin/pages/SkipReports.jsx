import { useState, useEffect } from 'react'
import { adminFetchSkipReports } from '../../lib/api'
import { Loader2, AlertTriangle, Filter } from 'lucide-react'

const REASON_LABEL = {
  construction: '🚧 Construction',
  accessibility: '♿ Accessibility',
  closed: '🔒 Closed',
  notfound: '❓ Not found',
  other: '💬 Other',
}

export default function SkipReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTour, setFilterTour] = useState('')

  useEffect(() => {
    adminFetchSkipReports()
      .then(setReports)
      .finally(() => setLoading(false))
  }, [])

  const tours = [...new Map(reports.map(r => [r.tour_id, r.tours?.name || r.tour_id])).entries()]
  const filtered = filterTour ? reports.filter(r => r.tour_id === filterTour) : reports

  const byCause = filtered.reduce((acc, r) => {
    const k = r.reason || 'other'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Skip Reports</h1>
          <p className="text-gray-400 mt-0.5 text-sm">{filtered.length} skip{filtered.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterTour}
            onChange={e => setFilterTour(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All tours</option>
            {tours.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary chips */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byCause).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
            <div key={reason} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fcd34d' }}>
              {REASON_LABEL[reason] || reason} · {count}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>No skips recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Tour</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Stop</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Team</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Note</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-white/70 truncate max-w-[140px]">{r.tours?.name || r.tour_id}</td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{r.stop_name}</div>
                      <div className="text-gray-500 text-xs">Stop {r.stop_order}</div>
                    </td>
                    <td className="px-4 py-3 text-white/70">{r.team_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d' }}>
                        {REASON_LABEL[r.reason] || r.reason || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs max-w-[180px] truncate">{r.note || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
