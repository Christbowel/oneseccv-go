import { useEffect, useState } from 'react'
import { EV, isStandalone, track } from '../lib/analytics'
import { LS } from '../config'

/**
 * "Add to home screen" nudge.
 * Chrome/Edge/Android fire `beforeinstallprompt`, so we can trigger the native
 * dialog. iOS Safari has no such API — there we explain the Share ▸ Add to
 * Home Screen gesture instead, which is the only way in.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow]         = useState(false)
  const [iosHint, setIosHint]   = useState(false)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(LS.installDismissed)) return

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    const onInstalled = () => { track(EV.installPWA, { source: 'prompt' }); setShow(false) }
    window.addEventListener('appinstalled', onInstalled)

    // iOS: no event to wait for — surface the hint after a little use.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
    let timer
    if (isIOS && isSafari) {
      timer = setTimeout(() => { setIosHint(true); setShow(true) }, 25000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(LS.installDismissed, String(Date.now()))
    setShow(false)
  }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' }))
    track(EV.installPWA, { outcome })
    if (outcome !== 'accepted') dismiss()
    setDeferred(null)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="animate-slide-up fixed left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl p-4"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)',
        background: 'rgba(10,15,30,0.97)',
        border: '1px solid rgba(255,107,26,0.35)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
        backdropFilter: 'blur(10px)',
      }}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.3)' }}>
          📲
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Install OneSecCV
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: '#A0A8C0' }}>
            {iosHint
              ? <>Tap <strong style={{ color: '#F5F5F5' }}>Share</strong> ▸ <strong style={{ color: '#F5F5F5' }}>Add to Home Screen</strong> to keep it one tap away.</>
              : 'Full screen, offline-ready, one tap from your home screen.'}
          </p>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-xs" style={{ color: '#5A6280' }}>✕</button>
      </div>

      {!iosHint && (
        <button onClick={install}
          className="mt-3 w-full rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98]"
          style={{ background: '#FF6B1A', color: '#fff' }}>
          Add to home screen
        </button>
      )}
    </div>
  )
}
