import 'leaflet/dist/leaflet.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n/index.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'

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
