import { useState, useEffect } from 'react'
import { adminFetchTourStats, adminFetchStopDropoff, adminFetchTours } from '../../lib/api'
import { Loader2, TrendingUp, Users, Trophy, DollarSign } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

function Card({ children, className = '' }) {
  return <div className={`bg-gray-900 rounded-2xl p-6 border border-gray-800 ${className}`}>{children}</div>
}

function SectionTitle({ children }) {
  return <h2 className="text-lg font-semibold text-white mb-4">{children}</h2>
}

const tooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '12px',
  color: '#fff',
}

export default function Analytics() {
  const [tourStats, setTourStats] = useState([])
  const [dropoff, setDropoff] = useState([])
  const [selectedTour, setSelectedTour] = useState('')
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDropoff, setLoadingDropoff] = useState(false)

  useEffect(() => {
    Promise.all([adminFetchTourStats(), adminFetchTours()])
      .then(([stats, tourList]) => {
        setTourStats(stats)
        setTours(tourList)
        if (tourList.length > 0) setSelectedTour(tourList[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedTour) return
    setLoadingDropoff(true)
    adminFetchStopDropoff(selectedTour)
      .then(setDropoff)
      .finally(() => setLoadingDropoff(false))
  }, [selectedTour])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  const revenueData = tourStats.map(s => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    revenue: Number(s.total_revenue),
    purchases: Number(s.total_purchases),
  }))

  const completionData = tourStats.map(s => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    rate: Number(s.completion_rate_pct),
    starts: Number(s.total_starts),
    completions: Number(s.total_completions),
  }))

  const pieData = tourStats
    .filter(s => Number(s.total_purchases) > 0)
    .map(s => ({ name: s.name, value: Number(s.total_purchases) }))

  const totals = tourStats.reduce((acc, s) => ({
    revenue: acc.revenue + Number(s.total_revenue),
    purchases: acc.purchases + Number(s.total_purchases),
    starts: acc.starts + Number(s.total_starts),
    completions: acc.completions + Number(s.total_completions),
  }), { revenue: 0, purchases: 0, starts: 0, completions: 0 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Tour performance, completion rates, and drop-off analysis</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `€${totals.revenue.toFixed(0)}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Purchases', value: totals.purchases, icon: Users, color: 'text-blue-400' },
          { label: 'Tours Started', value: totals.starts, icon: TrendingUp, color: 'text-purple-400' },
          { label: 'Completions', value: totals.completions, icon: Trophy, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
              <div>
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue + Completion charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle>Revenue by Tour</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`€${v}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Completion Rate by Tour (%)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={completionData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'Completion']} />
              <Bar dataKey="rate" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Purchase share pie */}
      {pieData.length > 0 && (
        <Card>
          <SectionTitle>Purchase Share by Tour</SectionTitle>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-300 text-sm truncate">{d.name}</span>
                  <span className="text-gray-500 text-sm ml-auto pl-4">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Drop-off analysis */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Stop Drop-off Analysis</SectionTitle>
          <select value={selectedTour} onChange={e => setSelectedTour(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {loadingDropoff ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : dropoff.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No progress data yet for this tour.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dropoff} margin={{ top: 0, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="stop_name" tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickFormatter={v => v.split(' ').slice(0, 2).join(' ')} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, 'Completed']} />
                <Line type="monotone" dataKey="completion_rate_pct" stroke="#3b82f6" strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {dropoff.map(s => (
                <div key={s.stop_id} className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-4 text-right flex-shrink-0">{s.order_index}</span>
                  <span className="text-gray-300 text-sm flex-1 truncate">{s.stop_name}</span>
                  <span className="text-xs text-gray-500">{s.total_attempts} attempts</span>
                  <div className="w-32 bg-gray-800 rounded-full h-2 flex-shrink-0">
                    <div className={`h-2 rounded-full transition-all ${
                      Number(s.completion_rate_pct) > 70 ? 'bg-emerald-500' :
                      Number(s.completion_rate_pct) > 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`} style={{ width: `${s.completion_rate_pct}%` }} />
                  </div>
                  <span className="text-white text-sm font-semibold w-10 text-right flex-shrink-0">
                    {s.completion_rate_pct}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
