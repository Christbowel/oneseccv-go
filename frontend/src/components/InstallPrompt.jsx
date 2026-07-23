import { useEffect, useState } from 'react'
import { useInstall } from '../lib/pwa'
import { EV, track } from '../lib/analytics'
import { LS } from '../config'

/**
 * Lightweight "install" nudge shown once after the user has something worth
 * coming back for. The full, always-available install entry lives in Settings
 * (InstallCard); this is just a gentle reminder.
 */
export default function InstallPrompt() {
  const { available, standalone, iosSafari, promptInstall } = useInstall()
  const [dismissed, setDismissed] = useState(() => Boolean(localStorage.getItem(LS.installDismissed)))
  const [show, setShow] = useState(false)

  // Reveal shortly after mount so it doesn't fight the first paint.
  useEffect(() => {
    if (dismissed || standalone) return
    if (!available && !iosSafari) return
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [dismissed, standalone, available, iosSafari])

  if (!show || dismissed || standalone) return null

  const dismiss = () => {
    localStorage.setItem(LS.installDismissed, String(Date.now()))
    setDismissed(true)
  }

  const install = async () => {
    const outcome = await promptInstall()
    track(EV.installPWA, { source: 'prompt', outcome })
    dismiss()
  }

  return (
    <div className="animate-slide-up fixed left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl p-4"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)',
        background: 'rgba(20,25,38,0.97)',
        border: '1px solid rgba(255,107,26,0.3)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
      }}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
          style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.3)' }}>
          📲
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
            Install OneSecCV
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: '#9BA6BC' }}>
            {iosSafari
              ? <>Tap <strong style={{ color: '#F2F4F8' }}>Share</strong> ▸ <strong style={{ color: '#F2F4F8' }}>Add to Home Screen</strong>.</>
              : 'Keep it one tap from your home screen, works offline.'}
          </p>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-xs" style={{ color: '#6C7488' }}>✕</button>
      </div>

      {available && (
        <button onClick={install}
          className="mt-3 w-full rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-[0.98]"
          style={{ background: '#FF6B1A', color: '#fff' }}>
          Add to home screen
        </button>
      )}
    </div>
  )
}
