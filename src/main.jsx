import 'leaflet/dist/leaflet.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const isAdmin = window.location.pathname.includes('/admin')

async function boot() {
  if (isAdmin) {
    const { default: AdminApp } = await import('./admin/AdminApp.jsx')
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode><AdminApp /></React.StrictMode>
    )
  } else {
    const { default: App } = await import('./App.jsx')
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode><App /></React.StrictMode>
    )
  }
}

boot()
