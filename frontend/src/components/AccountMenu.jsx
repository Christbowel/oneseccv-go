import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { OWNER_EMAIL } from '../config'

/** Avatar + dropdown: identity, storage explainer, sign out. */
export default function AccountMenu({ onOpenSettings, cvCount }) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  if (!user) return null

  const isOwner = OWNER_EMAIL && user.email?.toLowerCase() === OWNER_EMAIL

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        aria-haspopup="menu" aria-expanded={open} aria-label="Account"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-transform active:scale-95"
        style={{ border: '1.5px solid rgba(255,107,26,0.45)', background: '#171D2B' }}>
        {user.picture
          ? <img src={user.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          : <span className="text-sm font-bold text-white">{(user.name || user.email || '?')[0].toUpperCase()}</span>}
      </button>

      {open && (
        <div role="menu"
          className="animate-fade-in absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl"
          style={{ background: '#141926', border: '1px solid #272E40', boxShadow: '0 18px 50px rgba(0,0,0,0.6)' }}>

          <div className="px-4 py-3" style={{ borderBottom: '1px solid #222838' }}>
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate font-mono text-[11px]" style={{ color: '#828BA0' }}>{user.email}</p>
          </div>

          <div className="px-4 py-3" style={{ borderBottom: '1px solid #222838' }}>
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#828BA0' }}>
              Storage
            </p>
            <p className="mt-1.5 text-xs leading-relaxed" style={{ color: '#9BA6BC' }}>
              {cvCount ?? 0} CV{cvCount === 1 ? '' : 's'} in your private Drive folder.
              Revoke access anytime at{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer"
                className="underline" style={{ color: '#FF8C42' }}>
                Google account permissions
              </a>.
            </p>
          </div>

          <div className="p-1.5">
            <MenuItem icon="⚙" label="Settings" onClick={() => { setOpen(false); onOpenSettings?.() }} />
            {isOwner && (
              <MenuItem icon="📊" label="User analytics (GA4)" onClick={() => {
                setOpen(false)
                window.open('https://analytics.google.com/analytics/web/#/p/realtime/overview', '_blank', 'noopener')
              }} />
            )}
            <MenuItem icon="↩" label="Sign out" danger onClick={() => { setOpen(false); signOut() }} />
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button role="menuitem" onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
      style={{ color: danger ? '#EF6B6B' : '#CDD3E1' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <span className="w-4 text-center text-xs" aria-hidden="true">{icon}</span>{label}
    </button>
  )
}
