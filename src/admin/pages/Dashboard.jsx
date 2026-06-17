import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchTourStats, adminFetchLiveProgress } from '../../lib/api'
import { TrendingUp, Users, Trophy, ArrowRight, Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

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

function timeAgo(iso) {
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
  const [rlsWarning, setRlsWarning] = useState(false)

  useEffect(() => {
    Promise.all([
      adminFetchTourStats().catch(() => []),
      adminFetchLiveProgress().catch(() => []),
    ]).then(([tourStats, progress]) => {
      setStats(tourStats)
      setSessions(progress)
      // If we have purchases but no progress, RLS is likely blocking player writes
      const totPurchases = tourStats.reduce((s, t) => s + Number(t.total_purchases ?? 0), 0)
      if (totPurchases > 0 && progress.length === 0) setRlsWarning(true)
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

  const active = sessions.filter(s => !s.completed_at)
  const done = sessions.filter(s => s.completed_at)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of all tours and activity</p>
      </div>

      {/* RLS warning banner */}
      {rlsWarning && (
        <div className="flex gap-3 p-4 rounded-2xl border"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-sm font-semibold mb-1">Progress not syncing from players</p>
            <p className="text-amber-400/70 text-xs leading-relaxed mb-2">
              The player app can't write to <code className="bg-black/30 px-1 rounded">tour_progress</code> or <code className="bg-black/30 px-1 rounded">stop_progress</code> — run this SQL in your Supabase dashboard to fix it:
            </p>
            <pre className="text-xs text-amber-300/80 bg-black/30 rounded-xl p-3 overflow-x-auto leading-relaxed">{`-- Allow the player app (anon key) to write progress
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert purchases" ON purchases FOR INSERT WITH CHECK (true);

ALTER TABLE tour_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert tour_progress" ON tour_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "anon update tour_progress" ON tour_progress FOR UPDATE USING (true);

ALTER TABLE stop_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert stop_progress" ON stop_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "anon upsert stop_progress" ON stop_progress FOR UPDATE USING (true);`}</pre>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Teams Active" value={active.length} sub="not yet finished" icon={Users} color="bg-blue-600" />
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
              {active.length} in progress · {done.length} finished
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

              return (
                <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isComplete ? 'bg-emerald-400' : 'bg-blue-400'}`}
                    style={!isComplete ? { boxShadow: '0 0 0 3px rgba(96,165,250,0.2)' } : {}} />

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
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                        <Clock className="w-3 h-3" /> Active
                      </span>
                    )}
                    <div className="text-gray-600 text-xs mt-1">{timeAgo(s.created_at)}</div>
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
