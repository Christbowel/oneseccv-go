import { useState } from 'react'

export default function TabAPI({ currentKey, onSave, showNotification }) {
  const [key, setKey]         = useState('')
  const [saving, setSaving]   = useState(false)
  const [visible, setVisible] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const handleSave = async () => {
    if (!key.trim()) return
    setSaving(true)
    try {
      await onSave(key.trim())
      setKey('')
    } catch(e) {
      showNotification('error', String(e))
    } finally { setSaving(false) }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div style={{ maxWidth: 440, margin: '0 auto' }} className="flex flex-col items-center gap-6">

        <div className="text-center">
          <h2 className="font-bold text-2xl text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Settings</h2>
          <p className="text-sm" style={{ color: '#A0A8C0' }}>Connect your Gemini AI key to get started</p>
        </div>

        {/* Active key status */}
        {currentKey && (
          <div className="w-full flex items-center gap-3 p-4 rounded-xl"
            style={{ background: '#080C18', border: '1.5px solid rgba(16,185,129,0.3)' }}>
            <span className="w-2.5 h-2.5 rounded-full animate-pulse-slow" style={{ background: '#10B981', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold">Key active</p>
              <p className="font-mono text-xs truncate mt-0.5" style={{ color: '#A0A8C0' }}>{currentKey}</p>
            </div>
            <span className="font-mono text-xs px-2 py-1 rounded"
              style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              READY
            </span>
          </div>
        )}

        {/* Big CTA button */}
        {!currentKey && (
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
            className="w-full py-4 rounded-xl font-bold text-base tracking-wider uppercase text-center transition-all duration-200 active:scale-[0.98] glow-orange block"
            style={{ background: '#FF6B1A', color: '#fff', fontFamily: 'Syne, sans-serif', textDecoration: 'none' }}>
            GET YOUR FREE API KEY
          </a>
        )}

        {/* Paste field */}
        <div className="w-full">
          <label className="label">{currentKey ? 'Change key' : 'Paste your key'}</label>
          <div className="relative">
            <input
              type={visible ? 'text' : 'password'}
              placeholder="AIza..."
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="input-field pr-11"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
            <button type="button" onClick={() => setVisible(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors"
              style={{ color: '#A0A8C0' }}>{visible ? '🙈' : '👁'}</button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !key.trim()}
          className="w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: key.trim() ? '#FF6B1A' : '#1A2040', color: '#fff',
                   boxShadow: key.trim() ? '0 0 22px rgba(255,107,26,0.35)' : 'none' }}>
          {saving ? 'Verifying...' : 'ACTIVATE'}
        </button>

        {/* Privacy disclaimer link */}
        <button onClick={() => setShowDisclaimer(true)}
          className="text-xs transition-colors"
          style={{ color: '#5A6280' }}
          onMouseEnter={e => e.target.style.color = '#A0A8C0'}
          onMouseLeave={e => e.target.style.color = '#5A6280'}>
          🔒 How is my API key stored?
        </button>
      </div>

      {/* Disclaimer modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(5,8,16,0.85)' }}
          onClick={() => setShowDisclaimer(false)}>
          <div className="rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up"
            style={{ background: '#080C18', border: '1px solid #1A2040', boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <span className="text-lg">🔒</span>
              </div>
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: '#F5F5F5' }}>
                Your key is safe
              </h3>
            </div>

            <div className="space-y-3 text-sm leading-relaxed" style={{ color: '#A0A8C0' }}>
              <p>Your API key is stored <strong style={{ color: '#F5F5F5' }}>exclusively in your browser's local storage</strong>. It never leaves your device.</p>
              <p>When you generate a CV, your browser calls the Google Gemini API <strong style={{ color: '#F5F5F5' }}>directly</strong>. The key is sent only to Google, never to our servers.</p>
              <p>Our compilation server receives only the generated LaTeX code. It has <strong style={{ color: '#F5F5F5' }}>zero access</strong> to your API key, your personal data, or your uploaded files after processing.</p>
              <p>Closing your browser tab erases everything except the API key. You can remove it anytime from Settings.</p>
            </div>

            <button onClick={() => setShowDisclaimer(false)}
              className="w-full mt-6 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200"
              style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#A0A8C0' }}>
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
