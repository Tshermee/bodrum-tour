import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchTourStats, adminFetchLiveProgress } from '../../lib/api'
import { TrendingUp, Users, Trophy, ArrowRight, Loader2, CheckCircle2, Clock } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

// A team counts as "active now" if it isn't finished and has pinged within this
// window. Tweak this one value to widen/narrow the live count.
const ACTIVE_WINDOW_MINUTES = 180 // 3 hours
const ACTIVE_WINDOW_MS = ACTIVE_WINDOW_MINUTES * 60 * 1000

function isActiveNow(s) {
  // Requires a real recent heartbeat — a session that never reported activity
  // (no last_active_at) is not counted, so old/seeded rows don't inflate it.
  return !s.completed_at && !!s.last_active_at && (Date.now() - new Date(s.last_active_at) < ACTIVE_WINDOW_MS)
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Dashboard() {
  const [stats, setStats] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([
      adminFetchTourStats().catch(() => []),
      adminFetchLiveProgress().catch(() => []),
    ]).then(([tourStats, progress]) => {
      setStats(tourStats)
      setSessions(progress)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  const totals = stats.reduce((acc, s) => ({
    purchases: acc.purchases + Number(s.total_purchases ?? 0),
    revenue: acc.revenue + Number(s.total_revenue ?? 0),
    completions: acc.completions + Number(s.total_completions ?? 0),
    starts: acc.starts + Number(s.total_starts ?? 0),
  }), { purchases: 0, revenue: 0, completions: 0, starts: 0 })

  // Derive totals directly from live progress when the view is empty
  const liveStarts = sessions.length
  const liveCompletions = sessions.filter(s => s.completed_at).length
  const starts = totals.starts || liveStarts
  const completions = totals.completions || liveCompletions
  const overallRate = starts > 0 ? Math.round(completions / starts * 100) : 0

  const active = sessions.filter(isActiveNow)
  const inProgress = sessions.filter(s => !s.completed_at)
  const done = sessions.filter(s => s.completed_at)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of all tours and activity</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Teams Active" value={active.length} sub={`playing now · last ${ACTIVE_WINDOW_MINUTES >= 60 ? `${ACTIVE_WINDOW_MINUTES / 60}h` : `${ACTIVE_WINDOW_MINUTES}m`}`} icon={Users} color="bg-blue-600" />
        <StatCard label="Tours Finished" value={liveCompletions} sub="all time" icon={Trophy} color="bg-amber-600" />
        <StatCard label="Tours Started" value={liveStarts || starts} sub="unique sessions" icon={TrendingUp} color="bg-purple-600" />
        <StatCard label="Completion Rate" value={`${overallRate}%`} sub={`${completions} of ${starts}`} icon={CheckCircle2} color="bg-emerald-600" />
      </div>

      {/* Live Teams */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="font-semibold text-white">Teams</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {active.length} playing now · {inProgress.length} in progress · {done.length} finished
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">
            No sessions yet — data appears here once teams start playing.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sessions.map(s => {
              const stopsCompleted = Number(s.stop_progress?.[0]?.count ?? 0)
              const totalStops = Number(s.tours?.tour_stops?.[0]?.count ?? 0)
              const pct = totalStops > 0 ? Math.round(stopsCompleted / totalStops * 100) : 0
              const isComplete = !!s.completed_at
              const activeNow = isActiveNow(s)

              return (
                <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isComplete ? 'bg-emerald-400' : activeNow ? 'bg-blue-400' : 'bg-gray-600'}`}
                    style={activeNow ? { boxShadow: '0 0 0 3px rgba(96,165,250,0.2)' } : {}} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold truncate">{s.team_name || 'Unknown team'}</span>
                      <span className="text-gray-500 text-xs truncate">{s.tours?.name ?? s.tour_id}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${isComplete ? 'bg-emerald-400' : 'bg-blue-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs flex-shrink-0 w-20 text-right">
                        {stopsCompleted}{totalStops > 0 ? `/${totalStops} stops` : ' stops'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    ) : activeNow ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                        <Clock className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.25)' }}>
                        <Clock className="w-3 h-3" /> Idle
                      </span>
                    )}
                    <div className="text-gray-600 text-xs mt-1">
                      {isComplete ? timeAgo(s.completed_at) : `active ${timeAgo(s.last_active_at || s.created_at)}`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Per-tour breakdown */}
      {stats.length > 0 && (
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
          </div>
        </div>
      )}
    </div>
  )
}
