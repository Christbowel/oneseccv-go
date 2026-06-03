import { useState } from 'react'

export default function CVPreview({ pages, onDownload, onRefine, loading }) {
  const [zoom, setZoom] = useState(100)
  const [editPrompt, setEditPrompt] = useState('')

  const handleRefine = () => {
    if (!editPrompt.trim()) return
    onRefine(editPrompt.trim())
    setEditPrompt('')
  }

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Left: Edit panel ── */}
      <div className="w-72 shrink-0 flex flex-col"
        style={{ background: 'rgba(8,12,24,0.95)', borderRight: '1px solid #1A2040' }}>

        {/* Header */}
        <div className="p-4" style={{ borderBottom: '1px solid #1A2040' }}>
          <p className="label" style={{ marginBottom: 4 }}>CV Preview</p>
          <p className="text-xs" style={{ color: '#8892B0' }}>{pages.length} page{pages.length > 1 ? 's' : ''} generated</p>
        </div>

        {/* Download button */}
        <div className="p-4" style={{ borderBottom: '1px solid #1A2040' }}>
          <button onClick={onDownload} disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
            style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 22px rgba(255,107,26,0.35)' }}>
            ↓ DOWNLOAD PDF
          </button>
        </div>

        {/* Zoom */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1A2040' }}>
          <span className="font-mono text-xs" style={{ color: '#3A4060' }}>Zoom</span>
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <button onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="px-2 py-0.5 text-xs rounded" style={{ color: '#8892B0' }}>−</button>
            <span className="font-mono text-xs w-10 text-center" style={{ color: '#8892B0' }}>{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="px-2 py-0.5 text-xs rounded" style={{ color: '#8892B0' }}>+</button>
          </div>
        </div>

        {/* Edit section */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
          <p className="label" style={{ marginBottom: 0 }}>✏ Quick Edit</p>
          <p className="text-xs" style={{ color: '#3A4060' }}>Describe what to change:</p>

          {[
            'Change my job title',
            'Add a new experience',
            'Remove a section',
            'Make the summary shorter',
            'Translate to French',
          ].map((s, i) => (
            <button key={i} onClick={() => setEditPrompt(s)}
              className="text-left text-xs px-3 py-2 rounded-lg transition-all duration-200"
              style={{ color: '#3A4060', border: '1px solid transparent' }}
              onMouseEnter={e => { e.target.style.color = '#8892B0'; e.target.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { e.target.style.color = '#3A4060'; e.target.style.background = 'transparent' }}>
              "{s}"
            </button>
          ))}

          <div className="flex-1" />

          <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine() } }}
            placeholder="Describe your changes..."
            rows={3}
            className="w-full rounded-lg px-3 py-2.5 text-xs resize-none"
            style={{ background: '#080C18', border: '1.5px solid #2A3050', color: '#E8EAF0', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
            onFocus={e => e.target.style.borderColor = '#FF6B1A'}
            onBlur={e => e.target.style.borderColor = '#2A3050'} />

          <button onClick={handleRefine} disabled={!editPrompt.trim() || loading}
            className="w-full py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase transition-all duration-200 disabled:opacity-30"
            style={{ background: 'rgba(30,111,255,0.15)', border: '1px solid rgba(30,111,255,0.4)', color: '#5B8FFF' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-[#5B8FFF]/30 border-t-[#5B8FFF] animate-spin" />
                Applying...
              </span>
            ) : 'APPLY CHANGES'}
          </button>
        </div>
      </div>

      {/* ── Right: CV pages (Overleaf-style) ── */}
      <div className="flex-1 overflow-auto p-6" style={{ background: '#0A0F1E' }}>

        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: 'rgba(5,8,16,0.7)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-t-transparent animate-spin rounded-full"
                style={{ borderColor: 'rgba(255,107,26,0.3)', borderTopColor: '#FF6B1A' }} />
              <p className="font-mono text-xs" style={{ color: '#FF6B1A' }}>Re-compiling...</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-5">
          {pages.map((pageB64, i) => (
            <div key={i} className="cv-page"
              style={{ width: `${(595 * zoom) / 100}px`, maxWidth: '100%' }}>
              <img src={`data:image/png;base64,${pageB64}`} alt={`Page ${i + 1}`}
                className="w-full h-auto block" draggable={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
