import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Shows a "new version available" banner when the service worker detects a fresh
// deploy. Tapping Reload activates the new SW and reloads — which also re-fetches
// tour/config data on the next mount. Registered with registerType: 'prompt' so
// updates never apply silently mid-session.
export default function UpdateBanner() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Poll for a new deploy every 30 min so long-lived installed sessions
      // eventually surface the banner without the user navigating.
      if (registration) {
        setInterval(() => { registration.update().catch(() => {}) }, 30 * 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div
      className="fixed inset-x-0 z-[10000] flex justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <div
        className="w-full max-w-[400px] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0e7490, #0284c7)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <RefreshCw className="w-5 h-5 text-white flex-shrink-0" />
        <span className="flex-1 text-white text-sm font-medium">{t('update_available')}</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 rounded-xl text-sm font-bold active:scale-95 transition-transform flex-shrink-0"
          style={{ background: '#fff', color: '#0e7490' }}
        >
          {t('update_reload')}
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss"
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
