import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { initPWA } from './lib/pwa'

// Capture the install event as early as possible (it can fire before React).
initPWA()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>,
)

// ── PWA ─────────────────────────────────────────────────────
// Registered after load so it never competes with the first paint.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Activate a new build as soon as it finishes downloading.
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage('SKIP_WAITING')
          }
        })
      })
    }).catch(() => { /* the app works fine without offline support */ })

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  })
}
