import { GA_MEASUREMENT_ID } from '../config'

// ── Google Analytics 4 ──────────────────────────────────────
//
// This is how we count users without a backend. Every signed-in visitor is
// tagged with `user_id` = their Google `sub` (a pseudonymous, per-app id —
// never the email, which GA forbids). GA4 then reports "Total users" and
// "Active users" deduplicated across a phone, a laptop and the installed PWA.
//
// Everything here degrades to a no-op when VITE_GA_MEASUREMENT_ID is unset,
// so local development never pollutes the numbers.

let loaded = false
let queue = []

function gtag() {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(arguments)
}

export function initAnalytics() {
  if (loaded || !GA_MEASUREMENT_ID) return
  loaded = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(s)

  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    // The PWA is a single page; we send screen changes as events instead.
    app_name: 'OneSecCV',
    app_version: '4.0.0',
  })

  queue.forEach(([name, params]) => gtag('event', name, params))
  queue = []
}

/** Associates every subsequent hit with this account (dedupes across devices). */
export function identify(user) {
  if (!GA_MEASUREMENT_ID || !user?.id) return
  gtag('config', GA_MEASUREMENT_ID, {
    user_id: user.id,
    user_properties: {
      installed_pwa: isStandalone() ? 'yes' : 'no',
    },
  })
}

export function clearIdentity() {
  if (!GA_MEASUREMENT_ID) return
  gtag('config', GA_MEASUREMENT_ID, { user_id: null })
}

/** Fire-and-forget event. Queued until gtag.js finishes loading. */
export function track(name, params = {}) {
  if (!GA_MEASUREMENT_ID) {
    if (import.meta.env.DEV) console.debug('[analytics]', name, params)
    return
  }
  if (!loaded) { queue.push([name, params]); return }
  gtag('event', name, params)
}

export function trackScreen(screen) {
  track('screen_view', { screen_name: screen })
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

// Canonical event names used across the app — keeps GA reports tidy.
export const EV = {
  signUp:       'sign_up',
  login:        'login',
  generateStart:'generate_start',
  generateOk:   'generate_success',
  generateFail: 'generate_failure',
  download:     'download_cv',
  saveCloud:    'save_cv_drive',
  openHistory:  'open_history_cv',
  refine:       'refine_cv',
  letterStart:  'cover_letter_start',
  letterOk:     'cover_letter_success',
  letterFail:   'cover_letter_failure',
  downloadLetter: 'download_cover_letter',
  installPWA:   'pwa_install',
  keySaved:     'gemini_key_saved',
}
