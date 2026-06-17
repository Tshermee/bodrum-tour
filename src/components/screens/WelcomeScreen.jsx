import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Compass, ChevronRight, Star, Clock, MapPin } from 'lucide-react'
import LanguageSelector from '../ui/LanguageSelector'

export default function WelcomeScreen({ onStart, stats }) {
  const { t } = useTranslation()
  const [teamName, setTeamName] = useState('')
  const [touched, setTouched] = useState(false)

  const isValid = teamName.trim().length >= 1

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (isValid) onStart(teamName.trim())
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, #041a3d 0%, #072b5c 35%, #0a3e7e 60%, #0e7490 100%)' }} />

      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #22d3ee, transparent)' }} />
      <div className="absolute bottom-[30%] left-[-60px] w-48 h-48 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute bottom-[-40px] right-[-40px] w-56 h-56 rounded-full opacity-8"
        style={{ background: 'radial-gradient(circle, #22d3ee, transparent)' }} />

      <svg className="absolute bottom-0 left-0 right-0 opacity-20 animate-wave"
        viewBox="0 0 430 120" fill="none" preserveAspectRatio="none"
        style={{ width: '200%', transform: 'translateX(-25%)' }}>
        <path d="M0,60 C80,100 160,20 240,60 C320,100 400,20 480,60 C560,100 640,20 720,60 C800,100 880,20 960,60 L960,120 L0,120 Z" fill="#22d3ee" />
      </svg>

      {/* Language selector */}
      <div className="relative pt-safe px-4 pt-4 flex justify-end animate-fade-in">
        <LanguageSelector />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)' }}>
              <Compass className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-amber-900 fill-amber-900" />
            </div>
          </div>
        </div>

        <div className="text-center mb-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-cyan-400 text-sm font-semibold tracking-[0.3em] uppercase mb-2">
            {t('welcome_tagline')}
          </div>
          <h1 className="font-display text-white leading-none">
            <span className="block text-5xl font-black tracking-tight text-shadow">{t('welcome_heading_main')}</span>
            <span className="block text-3xl font-bold italic mt-1" style={{ color: '#22d3ee' }}>
              {t('welcome_heading_sub')}
            </span>
          </h1>
        </div>

        <div className="flex gap-5 mt-6 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { icon: MapPin, label: stats?.tours > 1 ? `${stats.tours} ${t('welcome_stats_tours')}` : `${stats?.stops ?? 7} ${t('welcome_stats_stops')}` },
            { icon: Clock, label: '2.5–3.5 hrs' },
            { icon: Star, label: stats ? `${stats.points.toLocaleString()} ${t('welcome_stats_points')}` : `1,400 ${t('welcome_stats_points')}` },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white/70 text-sm">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-white/60 text-sm leading-relaxed max-w-[300px] mb-8 animate-slide-up"
          style={{ animationDelay: '0.35s' }}>
          {t('welcome_description')}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-[320px] animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="mb-4">
            <label className="block text-white/70 text-xs font-semibold tracking-widest uppercase mb-2 ml-1">
              {t('welcome_form_label')}
            </label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={t('welcome_form_placeholder')}
              maxLength={30}
              autoComplete="off"
              className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 text-base border border-white/15 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
            {touched && !isValid && (
              <p className="text-red-400/80 text-xs mt-1.5 ml-1">{t('welcome_form_error')}</p>
            )}
          </div>

          <button type="submit"
            className="w-full py-4 rounded-xl font-bold text-white text-base tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9, #2563eb)', boxShadow: '0 4px 24px rgba(6, 182, 212, 0.4)' }}>
            {t('welcome_form_submit')}
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="relative pb-safe px-6 pt-2 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <p className="text-white/25 text-xs">{t('welcome_footer')}</p>
      </div>
    </div>
  )
}
