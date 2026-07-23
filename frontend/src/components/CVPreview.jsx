import { useState } from 'react'

const QUICK_EDITS = [
  'Make it fit on a single page',
  'Make the bullets more concrete and quantified',
  'Translate the whole CV to French',
  'Emphasise the skills the job description asks for',
]

export default function CVPreview({ pages, onDownload, onRefine, loading, canRefine }) {
  const [zoom, setZoom] = useState(100)
  const [sheet, setSheet] = useState(false)
  const [instruction, setInstruction] = useState('')

  const submitRefine = async (text) => {
    const value = (text ?? instruction).trim()
    if (!value) return
    setSheet(false)
    setInstruction('')
    await onRefine(value)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3"
        style={{ background: 'rgba(8,12,24,0.95)', borderBottom: '1px solid #1A2040' }}>

        <span className="shrink-0 font-mono text-xs" style={{ color: '#A0A8C0' }}>
          {pages.length} page{pages.length > 1 ? 's' : ''}
        </span>

        {/* Zoom — compact on mobile */}
        <div className="flex items-center gap-1.5">
          <ZoomButton label="−" onClick={() => setZoom(z => Math.max(50, z - 25))} />
          <span className="w-11 text-center font-mono text-xs" style={{ color: '#FF6B1A' }}>{zoom}%</span>
          <ZoomButton label="+" onClick={() => setZoom(z => Math.min(200, z + 25))} />
          <div className="ml-1 hidden items-center gap-1 lg:flex">
            {[75, 100, 150].map(v => (
              <button key={v} onClick={() => setZoom(v)}
                className="rounded px-2 py-1 font-mono text-xs transition-all"
                style={{
                  background: zoom === v ? 'rgba(255,107,26,0.15)' : 'transparent',
                  border: `1px solid ${zoom === v ? 'rgba(255,107,26,0.4)' : 'transparent'}`,
                  color: zoom === v ? '#FF6B1A' : '#A0A8C0',
                }}>
                {v}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => setSheet(true)} disabled={!canRefine || loading}
            className="rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(30,111,255,0.12)', border: '1px solid rgba(30,111,255,0.35)', color: '#5B8FFF' }}>
            ✏ <span className="hidden sm:inline">Refine</span>
          </button>
          <button onClick={onDownload} disabled={loading}
            className="hidden rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 lg:block"
            style={{ background: '#FF6B1A', color: '#fff' }}>
            ↓ PDF
          </button>
        </div>
      </div>

      {/* ── Pages ── */}
      <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain p-4 sm:p-8"
        style={{ background: '#0A0F1E' }}>
        {loading && (
          <div className="fixed inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.78)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'rgba(255,107,26,0.3)', borderTopColor: '#FF6B1A' }} />
              <p className="font-mono text-xs" style={{ color: '#FF6B1A' }}>Compiling…</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-5">
          {pages.map((pageB64, i) => (
            <div key={i} className="cv-page" style={{ width: `${(595 * zoom) / 100}px`, maxWidth: '100%' }}>
              <img src={`data:image/png;base64,${pageB64}`} alt={`Page ${i + 1}`}
                className="block h-auto w-full" draggable={false} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile download bar ── */}
      <div className="shrink-0 px-4 py-3 lg:hidden"
        style={{ borderTop: '1px solid #1A2040', background: 'rgba(8,12,24,0.9)' }}>
        <button onClick={onDownload} disabled={loading}
          className="w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 22px rgba(255,107,26,0.35)' }}>
          ↓ Download PDF
        </button>
      </div>

      {/* ── Refine sheet ── */}
      {sheet && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: 'rgba(5,8,16,0.85)' }} onClick={() => setSheet(false)}>
          <div className="animate-slide-up w-full max-w-md rounded-t-2xl p-5 sm:rounded-2xl sm:p-6"
            style={{ background: '#080C18', border: '1px solid #1A2040', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}>

            <h3 className="mb-1 text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#F5F5F5' }}>
              Refine your CV
            </h3>
            <p className="mb-4 text-sm" style={{ color: '#A0A8C0' }}>
              Describe the change in plain words — the AI rewrites and recompiles.
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_EDITS.map(q => (
                <button key={q} onClick={() => submitRefine(q)}
                  className="rounded-full px-3 py-1.5 text-left text-xs transition-colors active:scale-95"
                  style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#A0A8C0' }}>
                  {q}
                </button>
              ))}
            </div>

            <textarea rows={3} autoFocus value={instruction} onChange={e => setInstruction(e.target.value)}
              placeholder="e.g. move the projects section above education"
              className="textarea-field w-full" />

            <div className="mt-4 flex gap-3">
              <button onClick={() => setSheet(false)}
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#A0A8C0' }}>
                Cancel
              </button>
              <button onClick={() => submitRefine()} disabled={!instruction.trim()}
                className="flex-1 rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#FF6B1A', color: '#fff' }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ZoomButton({ label, onClick }) {
  return (
    <button onClick={onClick}
      aria-label={label === '+' ? 'Zoom in' : 'Zoom out'}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold transition-all active:scale-95"
      style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#F5F5F5' }}>
      {label}
    </button>
  )
}
