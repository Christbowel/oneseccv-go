import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as google from '../lib/googleAuth'
import { resetDriveCache } from '../lib/drive'
import { clearIdentity, EV, identify, track } from '../lib/analytics'
import { GOOGLE_CLIENT_ID } from '../config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [booting, setBooting] = useState(true)
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')
  const booted = useRef(false)

  // Restore the session on load; renew the token silently if it lapsed.
  useEffect(() => {
    if (booted.current) return
    booted.current = true

    const session = google.readSession()
    if (!session) { setBooting(false); return }

    setUser(session.user)
    identify(session.user)

    if (google.isExpired(session)) {
      google.getAccessToken()
        .catch(() => {
          // Silent renewal failed — keep them on the landing page rather than
          // firing Drive calls that would all 401.
          google.clearSession()
          setUser(null)
        })
        .finally(() => setBooting(false))
    } else {
      setBooting(false)
    }
  }, [])

  const signIn = useCallback(async () => {
    setError('')
    setBusy(true)
    try {
      const session = await google.signIn()
      setUser(session.user)
      identify(session.user)
      track(google.isFirstSignIn(session.user.id) ? EV.signUp : EV.login, { method: 'google' })
      return session
    } catch (e) {
      setError(e.message || 'Google sign-in failed.')
      throw e
    } finally {
      setBusy(false)
    }
  }, [])

  const signOut = useCallback(() => {
    // Clear local state synchronously so the UI returns to the landing page
    // instantly — never block sign-out on a network call (revoking the token
    // with Google can hang, which used to leave the user apparently stuck).
    google.clearSession()
    resetDriveCache()
    clearIdentity()
    setUser(null)
    try { window.google?.accounts?.id?.disableAutoSelect?.() } catch { /* noop */ }
    // Best-effort token revocation in the background.
    google.signOut().catch(() => {})
  }, [])

  /** Called when Drive reports the grant is gone: drop back to signed-out. */
  const sessionLost = useCallback((message) => {
    google.clearSession()
    resetDriveCache()
    setUser(null)
    setError(message || 'Your Google session expired. Sign in again.')
  }, [])

  const value = useMemo(() => ({
    user,
    booting,
    busy,
    error,
    setError,
    isAuthenticated: Boolean(user),
    googleConfigured: Boolean(GOOGLE_CLIENT_ID),
    signIn,
    signOut,
    sessionLost,
  }), [user, booting, busy, error, signIn, signOut, sessionLost])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
