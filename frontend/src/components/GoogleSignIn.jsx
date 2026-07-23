import { useAuth } from '../auth/AuthProvider'

/**
 * Sign-in button. It opens Google's OAuth popup asking for identity plus the
 * private app folder in Drive, so one click covers login *and* CV sync.
 */
export default function GoogleSignIn({ onSuccess, label = 'Continue with Google' }) {
  const { signIn, busy, googleConfigured } = useAuth()

  if (!googleConfigured) {
    return (
      <div className="w-full rounded-xl p-4 text-sm"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
        <p className="mb-1 font-semibold">Google Sign-In is not configured</p>
        <p className="text-xs leading-relaxed" style={{ color: '#9BA6BC' }}>
          Set <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> in the deployment environment,
          then redeploy. See <code className="font-mono">frontend/.env.example</code>.
        </p>
      </div>
    )
  }

  const handle = async () => {
    try {
      const session = await signIn()
      onSuccess?.(session)
    } catch { /* surfaced through auth.error */ }
  }

  return (
    <button
      onClick={handle}
      disabled={busy}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
      style={{ background: '#FFFFFF', color: '#1F1F1F', boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}>
      {busy ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
          Signing you in…
        </>
      ) : (
        <>
          <GoogleGlyph />
          {label}
        </>
      )}
    </button>
  )
}

function GoogleGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.8-9.8 6.8-17.1z"/>
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  )
}
