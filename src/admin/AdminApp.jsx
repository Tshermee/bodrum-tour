import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminLogin from './AdminLogin'
import AdminLayout from './AdminLayout'
import Dashboard from './pages/Dashboard'
import Tours from './pages/Tours'
import TourEdit from './pages/TourEdit'
import Stops from './pages/Stops'
import StopEdit from './pages/StopEdit'
import Purchases from './pages/Purchases'
import Analytics from './pages/Analytics'
import SkipReports from './pages/SkipReports'
import WelcomeConfig from './pages/WelcomeConfig'
import RulesConfig from './pages/RulesConfig'
import CompletionConfig from './pages/CompletionConfig'

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkAdmin(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkAdmin(session.user.id)
      else { setIsAdmin(false); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin(userId) {
    const { data } = await supabase.from('admin_users').select('id').eq('id', userId).maybeSingle()
    setIsAdmin(!!data)
    setLoading(false)
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session || !isAdmin) return <AdminLogin />

  return (
    <BrowserRouter basename={`${base}/admin`}>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/new" element={<TourEdit />} />
          <Route path="/tours/:id/edit" element={<TourEdit />} />
          <Route path="/tours/:tourId/stops" element={<Stops />} />
          <Route path="/tours/:tourId/stops/new" element={<StopEdit />} />
          <Route path="/tours/:tourId/stops/:id/edit" element={<StopEdit />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/skip-reports" element={<SkipReports />} />
          <Route path="/welcome-config" element={<WelcomeConfig />} />
          <Route path="/rules-config" element={<RulesConfig />} />
          <Route path="/completion-config" element={<CompletionConfig />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
    </BrowserRouter>
  )
}
