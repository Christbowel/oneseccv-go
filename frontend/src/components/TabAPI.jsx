import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export default function TabAPI({ currentKey, onSave, onClear, showToast }) {
  const { user } = useAuth()
  const [key, setKey]         = useState('')
  const [saving, setSaving]   = useState(false)
  const [visible, setVisible] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const masked = currentKey ? `${currentKey.slice(0, 6)}…${currentKey.slice(-4)}` : ''

  const handleSave = async () => {
    const trimmed = key.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('AIza')) {
      showToast('error', 'A Gemini key normally starts with "AIza". Double-check what you pasted.')
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      setKey('')
    } catch (e) {
      showToast('error', String(e?.message || e))
    } finally { setSaving(false) }
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pb-10 pt-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">

        <header className="text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            Settings
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#A0A8C0' }}>
            Connect the AI engine that writes your CV.
          </p>
        </header>

        {/* Account */}
        {user && (
          <section className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: '#080C18', border: '1px solid #1A2040' }}>
            {user.picture
              ? <img src={user.picture} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
              : <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: '#1A2040' }}>{(user.name || '?')[0].toUpperCase()}</div>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate font-mono text-[11px]" style={{ color: '#7A83A0' }}>{user.email}</p>
            </div>
            <span className="shrink-0 rounded px-2 py-1 font-mono text-[10px]"
              style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              SYNCED
            </span>
          </section>
        )}

        {/* Key status */}
        {currentKey ? (
          <section className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: '#080C18', border: '1.5px solid rgba(16,185,129,0.3)' }}>
            <span className="animate-pulse-slow h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: '#10B981' }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Gemini key active</p>
              <p className="mt-0.5 truncate font-mono text-xs" style={{ color: '#A0A8C0' }}>{masked}</p>
            </div>
            <button onClick={onClear}
              className="shrink-0 rounded-lg px-3 py-2 text-xs transition-colors active:scale-95"
              style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#EF6B6B' }}>
              Remove
            </button>
          </section>
        ) : (
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
            className="glow-orange block w-full rounded-xl py-4 text-center text-base font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
            style={{ background: '#FF6B1A', color: '#fff', fontFamily: 'Syne, sans-serif', textDecoration: 'none' }}>
            Get your free API key
          </a>
        )}

        {!currentKey && (
          <ol className="space-y-1.5 rounded-xl p-4 text-xs leading-relaxed"
            style={{ background: 'rgba(8,12,24,0.6)', border: '1px solid #131A34', color: '#A0A8C0' }}>
            <li>1. Open Google AI Studio with the button above.</li>
            <li>2. Sign in and click <strong style={{ color: '#F5F5F5' }}>Create API key</strong> — it is free.</li>
            <li>3. Copy it and paste it below. It stays on this device.</li>
          </ol>
        )}

        {/* Paste field */}
        <div>
          <label className="label" htmlFor="gemini-key">{currentKey ? 'Replace key' : 'Paste your key'}</label>
          <div className="relative">
            <input id="gemini-key"
              type={visible ? 'text' : 'password'}
              inputMode="text" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
              placeholder="AIza…"
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="input-field pr-12"
              style={{ fontFamily: 'JetBrains Mono, monospace' }} />
            <button type="button" onClick={() => setVisible(v => !v)}
              aria-label={visible ? 'Hide key' : 'Show key'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: '#A0A8C0' }}>{visible ? '🙈' : '👁'}</button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !key.trim()}
          className="w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: key.trim() ? '#FF6B1A' : '#1A2040',
            color: '#fff',
            boxShadow: key.trim() ? '0 0 22px rgba(255,107,26,0.35)' : 'none',
          }}>
          {saving ? 'Saving…' : 'Activate'}
        </button>

        <button onClick={() => setShowPrivacy(true)} className="text-xs underline" style={{ color: '#5A6280' }}>
          🔒 Where do my key and my CVs live?
        </button>
      </div>

      {showPrivacy && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: 'rgba(5,8,16,0.85)' }}
          onClick={() => setShowPrivacy(false)}>
          <div className="animate-slide-up w-full max-w-md rounded-t-2xl p-6 sm:rounded-2xl"
            style={{ background: '#080C18', border: '1px solid #1A2040', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}>

            <h3 className="mb-4 text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#F5F5F5' }}>
              Your data, plainly
            </h3>

            <div className="space-y-3 text-sm leading-relaxed" style={{ color: '#A0A8C0' }}>
              <p><strong style={{ color: '#F5F5F5' }}>Your API key</strong> never leaves this device. Your browser calls
                Google Gemini directly — there is no OneSecCV server in between.</p>
              <p><strong style={{ color: '#F5F5F5' }}>Your CVs</strong> are stored in a private folder of your own
                Google Drive that only this app can open. We keep no copy.</p>
              <p><strong style={{ color: '#F5F5F5' }}>Our compilation server</strong> only ever receives LaTeX code to
                turn into a PDF. It stores nothing after answering.</p>
              <p>Revoke everything anytime at{' '}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer"
                  className="underline" style={{ color: '#FF8C42' }}>Google account permissions</a>.</p>
            </div>

            <button onClick={() => setShowPrivacy(false)}
              className="mt-6 w-full rounded-lg py-3 text-sm font-bold uppercase tracking-widest"
              style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#A0A8C0' }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
