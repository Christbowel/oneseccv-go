import { useInstall } from '../lib/pwa'
import { EV, track } from '../lib/analytics'

/** Persistent "Install the app" block for the Settings screen. */
export default function InstallCard() {
  const { available, standalone, iosSafari, ios, promptInstall } = useInstall()

  if (standalone) {
    return (
      <section className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: '#141926', border: '1px solid rgba(16,185,129,0.25)' }}>
        <span className="text-lg">✅</span>
        <div>
          <p className="text-sm font-medium text-white">App installed</p>
          <p className="text-xs" style={{ color: '#9BA6BC' }}>You are running OneSecCV as an app.</p>
        </div>
      </section>
    )
  }

  const install = async () => {
    const outcome = await promptInstall()
    track(EV.installPWA, { source: 'settings', outcome })
  }

  return (
    <section className="rounded-2xl p-4" style={{ background: '#141926', border: '1px solid #272E40' }}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.3)' }}>
          📲
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Install the app</p>
          <p className="text-xs leading-snug" style={{ color: '#9BA6BC' }}>
            Full screen, offline-ready, one tap from your home screen.
          </p>
        </div>
      </div>

      {available ? (
        <button onClick={install}
          className="mt-3 w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 6px 20px rgba(255,107,26,0.28)' }}>
          Add to home screen
        </button>
      ) : iosSafari ? (
        <ol className="mt-3 space-y-1.5 rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: '#171D2B', border: '1px solid #222838', color: '#9BA6BC' }}>
          <li>1. Tap the <strong style={{ color: '#F2F4F8' }}>Share</strong> button in Safari (the box with an arrow).</li>
          <li>2. Choose <strong style={{ color: '#F2F4F8' }}>Add to Home Screen</strong>.</li>
          <li>3. Tap <strong style={{ color: '#F2F4F8' }}>Add</strong>. OneSecCV lands on your home screen.</li>
        </ol>
      ) : ios ? (
        <p className="mt-3 rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: '#171D2B', border: '1px solid #222838', color: '#9BA6BC' }}>
          Open OneSecCV in <strong style={{ color: '#F2F4F8' }}>Safari</strong>, then use
          Share ▸ Add to Home Screen to install it.
        </p>
      ) : (
        <p className="mt-3 rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: '#171D2B', border: '1px solid #222838', color: '#9BA6BC' }}>
          Open this site in <strong style={{ color: '#F2F4F8' }}>Chrome</strong> or{' '}
          <strong style={{ color: '#F2F4F8' }}>Edge</strong> on your phone, then use the browser
          menu ▸ <strong style={{ color: '#F2F4F8' }}>Install app</strong>.
        </p>
      )}
    </section>
  )
}
