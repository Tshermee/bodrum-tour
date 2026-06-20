import 'leaflet/dist/leaflet.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n/index.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// After a new deploy, the loaded page may try to import a code-split chunk whose
// filename changed — it 404s and React renders nothing (blank/blue screen). Vite
// fires `vite:preloadError`; do a one-time reload to fetch the fresh chunks.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    if (!sessionStorage.getItem('vite-preload-reloaded')) {
      sessionStorage.setItem('vite-preload-reloaded', '1')
      window.location.reload()
    }
  })
}

const isAdmin = window.location.pathname.includes('/admin')

async function boot() {
  if (isAdmin) {
    const { default: AdminApp } = await import('./admin/AdminApp.jsx')
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode><ErrorBoundary label="AdminApp"><AdminApp /></ErrorBoundary></React.StrictMode>
    )
  } else {
    const { default: App } = await import('./App.jsx')
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode><ErrorBoundary label="App"><App /></ErrorBoundary></React.StrictMode>
    )
  }
}

boot()
