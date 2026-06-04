import { useState } from 'react'

export default function CVPreview({ pages, onDownload, loading }) {
  const [zoom, setZoom] = useState(100)
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Top bar: zoom + actions ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{ background: 'rgba(8,12,24,0.95)', borderBottom: '1px solid #1A2040' }}>

        {/* Left: page count */}
        <span className="font-mono text-xs" style={{ color: '#A0A8C0' }}>
          {pages.length} page{pages.length > 1 ? 's' : ''}
        </span>

        {/* Center: zoom controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(Math.max(50, zoom - 25))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200"
            style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#F5F5F5' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B1A'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1A2040'}>
            −
          </button>

          <div className="flex items-center gap-1">
            {[50, 75, 100, 125, 150].map(v => (
              <button key={v} onClick={() => setZoom(v)}
                className="px-2.5 py-1 rounded text-xs font-mono transition-all duration-200"
                style={{
                  background: zoom === v ? 'rgba(255,107,26,0.15)' : 'transparent',
                  border: zoom === v ? '1px solid rgba(255,107,26,0.4)' : '1px solid transparent',
                  color: zoom === v ? '#FF6B1A' : '#A0A8C0',
                }}>
                {v}%
              </button>
            ))}
          </div>

          <button onClick={() => setZoom(Math.min(200, zoom + 25))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200"
            style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#F5F5F5' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B1A'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1A2040'}>
            +
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowEditModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200"
            style={{ background: 'rgba(30,111,255,0.12)', border: '1px solid rgba(30,111,255,0.35)', color: '#5B8FFF' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#5B8FFF'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,111,255,0.35)'}>
            ✏ EDIT
          </button>

          <button onClick={onDownload} disabled={loading}
            className="px-5 py-2 rounded-lg font-bold text-xs tracking-widest uppercase transition-all duration-200 active:scale-95 disabled:opacity-40 glow-orange"
            style={{ background: '#FF6B1A', color: '#fff' }}>
            ↓ DOWNLOAD PDF
          </button>
        </div>
      </div>

      {/* ── Pages ── */}
      <div className="flex-1 overflow-auto p-8" style={{ background: '#0A0F1E' }}>
        {loading && (
          <div className="fixed inset-0 z-30 flex items-center justify-center"
            style={{ background: 'rgba(5,8,16,0.75)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-t-transparent animate-spin rounded-full"
                style={{ borderColor: 'rgba(255,107,26,0.3)', borderTopColor: '#FF6B1A' }} />
              <p className="font-mono text-xs" style={{ color: '#FF6B1A' }}>Compiling...</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          {pages.map((pageB64, i) => (
            <div key={i} className="cv-page"
              style={{
                width: `${(595 * zoom) / 100}px`,
                maxWidth: '95vw',
              }}>
              <img
                src={`data:image/png;base64,${pageB64}`}
                alt={`Page ${i + 1}`}
                className="w-full h-auto block"
                style={{ imageRendering: 'auto' }}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(5,8,16,0.85)' }}
          onClick={() => setShowEditModal(false)}>
          <div className="rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up"
            style={{ background: '#080C18', border: '1px solid #1A2040', boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(30,111,255,0.12)', border: '1px solid rgba(30,111,255,0.3)' }}>
                <span className="text-lg">✏️</span>
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: '#F5F5F5' }}>
                  Visual Editor
                </h3>
                <p className="text-xs" style={{ color: '#A0A8C0' }}>Word-like editing</p>
              </div>
            </div>

            <div className="p-4 rounded-xl mb-6"
              style={{ background: 'rgba(30,111,255,0.06)', border: '1px solid rgba(30,111,255,0.2)' }}>
              <p className="text-sm leading-relaxed" style={{ color: '#A0A8C0' }}>
                L'editeur visuel (gras, souligne, edition de texte) est disponible uniquement sur la <strong style={{ color: '#5B8FFF' }}>version PC et Mobile</strong>.
              </p>
              <p className="text-xs mt-3" style={{ color: '#5A6280' }}>
                Sur le web, vous pouvez regenerer votre CV avec des instructions différentes dans l'onglet Import ou Manual.
              </p>
            </div>

            <button onClick={() => setShowEditModal(false)}
              className="w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200"
              style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#A0A8C0' }}>
              COMPRIS
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
