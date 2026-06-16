import { useState, useEffect } from 'react'
import { adminFetchPurchases, adminFetchTours } from '../../lib/api'
import { Search, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 25

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [tourFilter, setTourFilter] = useState('')
  const [search, setSearch] = useState('')
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { adminFetchTours().then(setTours) }, [])

  useEffect(() => {
    setLoading(true)
    adminFetchPurchases({ page, pageSize: PAGE_SIZE, tourId: tourFilter || undefined })
      .then(({ data, count }) => { setPurchases(data); setCount(count) })
      .finally(() => setLoading(false))
  }, [page, tourFilter])

  const filtered = search
    ? purchases.filter(p =>
        p.team_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()))
    : purchases

  function exportCsv() {
    const rows = [
      ['Date', 'Team', 'Email', 'Tour', 'Amount', 'Status'],
      ...purchases.map(p => [
        new Date(p.created_at).toLocaleDateString(),
        p.team_name ?? '',
        p.email ?? '',
        p.tours?.name ?? p.tour_id,
        p.amount,
        p.status,
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `purchases-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Purchases</h1>
          <p className="text-gray-400 mt-1">{count} total purchase{count !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCsv}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors border border-gray-700">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search team or email…" />
        </div>
        <select value={tourFilter} onChange={e => { setTourFilter(e.target.value); setPage(0) }}
          className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All tours</option>
          {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
          <div className="col-span-3">Team / Email</div>
          <div className="col-span-3">Tour</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No purchases found.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map(p => (
              <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors items-center">
                <div className="col-span-3">
                  <p className="text-white text-sm font-medium truncate">{p.team_name || '—'}</p>
                  <p className="text-gray-500 text-xs truncate">{p.email || '—'}</p>
                </div>
                <div className="col-span-3 text-gray-300 text-sm truncate">{p.tours?.name ?? p.tour_id}</div>
                <div className="col-span-2 text-gray-400 text-sm">{new Date(p.created_at).toLocaleDateString()}</div>
                <div className="col-span-2 text-right text-white font-semibold text-sm">€{Number(p.amount).toFixed(2)}</div>
                <div className="col-span-2 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                    ${p.status === 'completed' ? 'bg-emerald-900/50 text-emerald-400' :
                      p.status === 'refunded' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <span className="text-gray-500 text-sm">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
