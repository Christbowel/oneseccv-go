// ── Runtime configuration ───────────────────────────────────
//
// COMPILER_URL empty ⇒ same-origin `/api/...`, which Vercel rewrites to the
// compilation VPS (see vercel.json). That keeps the browser on HTTPS and
// avoids mixed-content blocking.
//
// Everything else — auth, CV history, analytics — runs in the browser against
// Google's own APIs. There is no OneSecCV backend.

export const COMPILER_URL      = import.meta.env.VITE_COMPILER_URL || ''
export const GOOGLE_CLIENT_ID  = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''

// Your own Google account: unlocks the shortcut to the GA4 dashboard where the
// user count lives. Purely cosmetic — there is no privileged data in the app.
export const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL || '').toLowerCase()

export const GEMINI_MODEL    = 'gemini-flash-latest'
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export const APP_NAME    = 'OneSecCV'
export const APP_VERSION = '4.0.0'

// localStorage keys
export const LS = {
  session:   'oneseccv_session',    // Google access token + profile
  knownUser: 'oneseccv_known',      // first-sign-in marker (GA sign_up event)
  apiKey:    'oneseccv_apikey',     // user's own Gemini key
  draft:     'oneseccv_draft',      // unsent form content
  template:  'oneseccv_template',   // last selected template
  goalJob:   'oneseccv_goaljob',
  jobDesc:   'oneseccv_jobdesc',
  installDismissed: 'oneseccv_install_dismissed',
  seenOnboarding:   'oneseccv_seen_onboarding',
}
