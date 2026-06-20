import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, Map, ShoppingBag, BarChart3,
  LogOut, Menu, X, ChevronRight, MapPin, SkipForward, Home, BookOpen, Trophy, Tag
} from 'lucide-react'

const NAV_MAIN = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/tours', label: 'Tours', icon: Map },
  { path: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { path: '/discounts', label: 'Discounts', icon: Tag },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/skip-reports', label: 'Skip Reports', icon: SkipForward },
]
const NAV_CONFIG = [
  { path: '/welcome-config', label: 'Welcome Screen', icon: Home },
  { path: '/rules-config', label: 'Game Rules', icon: BookOpen },
  { path: '/completion-config', label: 'Mission Complete', icon: Trophy },
]
const NAV = [...NAV_MAIN, ...NAV_CONFIG]

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function isActive(path, exact) {
    return exact ? location.pathname === path : location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Bodrum Tour</div>
            <div className="text-xs text-gray-400">Admin Panel</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {NAV_MAIN.map(({ path, label, icon: Icon, exact }) => (
            <Link key={path} to={path} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                ${isActive(path, exact)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {isActive(path, exact) && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-800/60">
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest uppercase text-gray-600">Config</p>
            {NAV_CONFIG.map(({ path, label, icon: Icon, exact }) => (
              <Link key={path} to={path} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${isActive(path, exact)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isActive(path, exact) && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            ))}
          </div>
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur border-b border-gray-800 flex items-center gap-4 px-6 py-4">
          <button onClick={() => setOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-gray-400 text-sm">
            {NAV.find(n => isActive(n.path, n.exact))?.label ?? 'Admin'}
          </div>
        </header>
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
