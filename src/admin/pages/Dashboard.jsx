import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchTourStats, adminFetchPurchases } from '../../lib/api'
import { TrendingUp, ShoppingBag, Users, Trophy, ArrowRight, Loader2 } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminFetchTourStats(), adminFetchPurchases({ pageSize: 5 })])
      .then(([tourStats, { data }]) => {
        setStats(tourStats)
        setRecent(data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  const totals = stats.reduce((acc, s) => ({
    purchases: acc.purchases + Number(s.total_purchases),
    revenue: acc.revenue + Number(s.total_revenue),
    completions: acc.completions + Number(s.total_completions),
    starts: acc.starts + Number(s.total_starts),
  }), { purchases: 0, revenue: 0, completions: 0, starts: 0 })

  const overallRate = totals.starts > 0
    ? Math.round(totals.completions / totals.starts * 100)
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of all tours and activity</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Purchases" value={totals.purchases} sub="all time" icon={ShoppingBag} color="bg-blue-600" />
        <StatCard label="Revenue" value={`€${totals.revenue.toFixed(0)}`} sub="all tours" icon={TrendingUp} color="bg-emerald-600" />
        <StatCard label="Tours Started" value={totals.starts} sub="unique sessions" icon={Users} color="bg-purple-600" />
        <StatCard label="Completion Rate" value={`${overallRate}%`} sub={`${totals.completions} finished`} icon={Trophy} color="bg-amber-600" />
      </div>

      {/* Per-tour breakdown */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Tour Performance</h2>
          <Link to="/analytics" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
            Full analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-800">
          {stats.map(s => (
            <div key={s.id} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{s.name}</p>
                <p className="text-gray-400 text-sm">{s.total_purchases} purchases · €{Number(s.total_revenue).toFixed(0)} revenue</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-white font-semibold">{s.completion_rate_pct}%</div>
                <div className="text-gray-500 text-xs">completion</div>
              </div>
              <div className="w-24 bg-gray-800 rounded-full h-2 flex-shrink-0">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${s.completion_rate_pct}%` }} />
              </div>
            </div>
          ))}
          {stats.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">No data yet. Purchases will appear here.</div>
          )}
        </div>
      </div>

      {/* Recent purchases */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Recent Purchases</h2>
          <Link to="/purchases" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-800">
          {recent.map(p => (
            <div key={p.id} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{p.team_name || 'Anonymous'}</p>
                <p className="text-gray-400 text-sm">{p.tours?.name ?? p.tour_id}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-white font-semibold">€{Number(p.amount).toFixed(2)}</div>
                <div className="text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
                ${p.status === 'completed' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                {p.status}
              </span>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">No purchases yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
