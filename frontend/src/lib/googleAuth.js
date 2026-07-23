import { GOOGLE_CLIENT_ID, LS } from '../config'

// ── Google sign-in, 100% client-side ────────────────────────
//
// One consent screen buys us two things:
//   • identity  — `openid email profile` → who the user is (for GA4 user_id)
//   • storage   — `drive.appdata`        → a private folder in THEIR Drive
//
// There is no backend to verify anything, and that is fine: the access token
// is validated by Google's own APIs on every call, and nothing of ours is
// protected by it.

export const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.appdata',
].join(' ')

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo'

// Refresh a little before the real deadline so a long request can't straddle it.
const EXPIRY_MARGIN_MS = 120_000

let gisPromise = null

/** Loads the Google Identity Services script exactly once. */
export function loadGIS() {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve(window.google)
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`)
    const script = existing || document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve(window.google))
    script.addEventListener('error', () => {
      gisPromise = null
      reject(new Error('Could not load Google Sign-In. Check your connection or an ad-blocker.'))
    })
    if (!existing) document.head.appendChild(script)
  })
  return gisPromise
}

// ── Token storage ───────────────────────────────────────────

export function readSession() {
  try {
    const raw = localStorage.getItem(LS.session)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s?.accessToken || !s?.user) return null
    return s
  } catch { return null }
}

function writeSession(session) {
  localStorage.setItem(LS.session, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(LS.session)
}

export function isExpired(session) {
  return !session?.expiresAt || Date.now() > session.expiresAt - EXPIRY_MARGIN_MS
}

// ── Token client ────────────────────────────────────────────

let tokenClient = null
let pending = null

async function getTokenClient() {
  if (tokenClient) return tokenClient
  const google = await loadGIS()
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (!pending) return
      if (response.error) pending.reject(new Error(describeError(response)))
      else pending.resolve(response)
      pending = null
    },
    error_callback: (err) => {
      if (!pending) return
      pending.reject(new Error(describeError(err)))
      pending = null
    },
  })
  return tokenClient
}

function describeError(e) {
  const type = e?.type || e?.error
  switch (type) {
    case 'popup_closed':
    case 'popup_closed_by_user':
      return 'Sign-in window closed before finishing.'
    case 'popup_failed_to_open':
      return 'Your browser blocked the sign-in window. Allow pop-ups for this site and retry.'
    case 'access_denied':
      return 'Access denied. OneSecCV needs its private Drive folder to store your CVs.'
    default:
      return e?.error_description || e?.error || 'Google sign-in failed.'
  }
}

/**
 * Requests an access token.
 * @param {boolean} interactive false ⇒ silent renewal (no consent UI).
 */
function requestToken({ interactive }) {
  return new Promise(async (resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Sign-In is not configured (VITE_GOOGLE_CLIENT_ID missing).'))
      return
    }
    try {
      const client = await getTokenClient()
      if (pending) pending.reject(new Error('Another sign-in is already in progress.'))
      pending = { resolve, reject }
      // prompt:'' reuses the existing grant silently; 'consent' forces the dialog.
      client.requestAccessToken({ prompt: interactive ? '' : 'none' })
    } catch (e) {
      pending = null
      reject(e)
    }
  })
}

// ── Public API ──────────────────────────────────────────────

/** Full interactive sign-in. Must be called from a user gesture. */
export async function signIn() {
  const token = await requestToken({ interactive: true })
  const user = await fetchProfile(token.access_token)
  const session = {
    accessToken: token.access_token,
    expiresAt: Date.now() + (Number(token.expires_in || 3600) * 1000),
    scope: token.scope || SCOPES,
    user,
  }
  writeSession(session)
  return session
}

/**
 * Returns a valid access token, renewing silently when needed.
 * Throws when the user must sign in again interactively.
 */
export async function getAccessToken() {
  const session = readSession()
  if (!session) throw new NeedsSignIn()
  if (!isExpired(session)) return session.accessToken

  try {
    const token = await requestToken({ interactive: false })
    const renewed = {
      ...session,
      accessToken: token.access_token,
      expiresAt: Date.now() + (Number(token.expires_in || 3600) * 1000),
    }
    writeSession(renewed)
    return renewed.accessToken
  } catch {
    throw new NeedsSignIn()
  }
}

export class NeedsSignIn extends Error {
  constructor() {
    super('Your Google session expired. Sign in again to sync your CVs.')
    this.name = 'NeedsSignIn'
  }
}

/** Revokes the token with Google and forgets the local session. */
export async function signOut() {
  const session = readSession()
  clearSession()
  if (session?.accessToken) {
    try {
      const google = await loadGIS()
      google.accounts.oauth2.revoke(session.accessToken, () => {})
    } catch { /* the local session is gone either way */ }
  }
}

/** Fetches the OpenID profile that matches an access token. */
export async function fetchProfile(accessToken) {
  const res = await fetch(USERINFO, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error('Could not read your Google profile.')
  const p = await res.json()
  return {
    id: p.sub,
    email: p.email,
    name: p.name || p.given_name || p.email,
    picture: p.picture || '',
    locale: p.locale || '',
  }
}

/** Has this browser ever signed in before? Used to fire GA4 `sign_up` once. */
export function isFirstSignIn(userId) {
  const key = `${LS.knownUser}:${userId}`
  if (localStorage.getItem(key)) return false
  localStorage.setItem(key, String(Date.now()))
  return true
}
