import { lazy, Suspense, useState } from 'react'
import { EV, track } from '../lib/analytics'

// CodeMirror only loads when someone opens the editor, so the preview itself
// stays light on mobile.
const LatexEditor = lazy(() => import('./LatexEditor').catch(() => ({ default: EditorLoadError })))

const BLUE_BUTTON = { background: 'rgba(30,111,255,0.12)', border: '1px solid rgba(30,111,255,0.35)', color: '#5B8FFF' }

export default function CVPreview({
  doc, onDocChange, cvPages, letterPages, hasLetter,
  onGenerateLetter, onDownload, loading, canUseAI,
  source, onSourceChange, dirty, onRecompile, recompiling, onQuickEdit,
}) {
  const [zoom, setZoom] = useState(100)
  const [editing, setEditing] = useState(false)

  const isLetter = doc === 'letter'
  const pages = isLetter ? letterPages : cvPages

  const openEditor = () => {
    setEditing(true)
    track(EV.editOpen, { doc })
  }

  if (editing) {
    return (
      <div className="flex h-full flex-col overflow-hidden" style={{ background: '#050810' }}>

        {/* ── Editor bar ── */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-5"
          style={{ background: '#080C18', borderBottom: '1px solid #1A2040' }}>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden truncate font-mono text-xs sm:inline" style={{ color: '#A0A8C0' }}>
              {isLetter ? 'cover-letter.tex' : 'cv.tex'}
            </span>
            {dirty && (
              <span className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide"
                style={{ color: '#FF6B1A', background: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.35)' }}>
                ● Modified
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95"
              style={{ background: '#080C18', border: '1px solid #1A2040', color: '#A0A8C0' }}>
              Close
            </button>
            <button onClick={onDownload} disabled={loading}
              className="rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#080C18', border: '1px solid rgba(255,107,26,0.4)', color: '#FF6B1A' }}>
              ↓ PDF
            </button>
            <button onClick={onRecompile} disabled={recompiling}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60 ${recompiling ? '' : 'glow-orange'}`}
              style={{ background: '#FF6B1A', color: '#fff' }}>
              {recompiling ? 'Compiling...' : '⟳ Recompile'}
            </button>
          </div>
        </div>

        {/* ── Split: code | preview (stacked under 768px) ── */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <section aria-label="LaTeX source"
            className="flex min-h-0 flex-1 flex-col border-b border-[#1A2040] md:w-1/2 md:flex-none md:border-b-0 md:border-r"
            style={{ background: '#080C18' }}>
            <div className="min-h-0 flex-1">
              <Suspense fallback={<EditorMessage text="Loading editor..." />}>
                <LatexEditor value={source} onChange={onSourceChange} />
              </Suspense>
            </div>
            <QuickEdit onApply={onQuickEdit} canUseAI={canUseAI} />
          </section>

          <section aria-label="Preview" className="relative flex min-h-0 flex-1 flex-col md:w-1/2 md:flex-none">
            <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1.5"
              style={{ background: '#080C18', borderBottom: '1px solid #1A2040' }}>
              <PageCount count={pages.length} />
              <ZoomControls zoom={zoom} setZoom={setZoom} />
            </div>
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-6" style={{ background: '#050810' }}>
              <Pages pages={pages} zoom={zoom} />
            </div>
            {(recompiling || loading) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.72)' }}>
                <Spinner label={recompiling ? 'Compiling...' : 'Building PDF...'} />
              </div>
            )}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Document switch: CV ⇄ Cover letter ── */}
      <div className="flex shrink-0 items-center justify-center gap-2 px-3 pt-3"
        style={{ background: 'rgba(8,12,24,0.95)' }}>
        <div className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-xl p-1"
          style={{ background: '#171D2B', border: '1px solid #272E40' }}>
          <DocTab active={!isLetter} onClick={() => onDocChange('cv')} icon="📄" label="CV" />
          {hasLetter ? (
            <DocTab active={isLetter} onClick={() => onDocChange('letter')} icon="✉" label="Cover letter" />
          ) : (
            <button onClick={onGenerateLetter} disabled={loading || !canUseAI}
              className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'rgba(30,111,255,0.12)', border: '1px solid rgba(30,111,255,0.4)', color: '#5B8FFF' }}>
              <span aria-hidden="true">✉</span> Generate letter
            </button>
          )}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3"
        style={{ background: 'rgba(8,12,24,0.95)', borderBottom: '1px solid #272E40' }}>

        <PageCount count={pages.length} />
        <ZoomControls zoom={zoom} setZoom={setZoom} />

        <div className="flex shrink-0 items-center gap-2">
          <button onClick={openEditor} disabled={loading}
            className="rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
            style={BLUE_BUTTON}>
            ✏ <span className="hidden sm:inline">Edit</span>
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
        style={{ background: '#171D2B' }}>
        {loading && (
          <div className="fixed inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(5,8,16,0.78)' }}>
            <Spinner label={isLetter && letterPages.length === 0 ? 'Writing your letter...' : 'Compiling...'} />
          </div>
        )}
        <Pages pages={pages} zoom={zoom} />
      </div>

      {/* ── Mobile download bar ── */}
      <div className="shrink-0 px-4 py-3 lg:hidden"
        style={{ borderTop: '1px solid #272E40', background: 'rgba(8,12,24,0.9)' }}>
        <button onClick={onDownload} disabled={loading}
          className="w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 22px rgba(255,107,26,0.35)' }}>
          ↓ Download {isLetter ? 'letter' : 'CV'} PDF
        </button>
      </div>
    </div>
  )
}

function QuickEdit({ onApply, canUseAI }) {
  const [instruction, setInstruction] = useState('')
  const [applying, setApplying] = useState(false)

  const apply = async () => {
    const value = instruction.trim()
    if (!value || applying) return
    setApplying(true)
    try {
      if (await onApply(value)) setInstruction('')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="shrink-0 px-3 pb-3 pt-2.5" style={{ borderTop: '1px solid #1A2040' }}>
      <label htmlFor="quick-edit-ai" className="mb-1.5 block text-[11px] font-medium tracking-wide" style={{ color: '#A0A8C0' }}>
        Quick edit with AI
      </label>
      <div className="flex gap-2">
        <textarea id="quick-edit-ai" rows={2} value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="Describe a change: remove the second bullet, add a project section, translate to French..."
          className="min-w-0 flex-1 resize-none rounded-lg border border-[#1A2040] bg-[#050810] px-3 py-2 text-sm leading-snug text-[#F5F5F5] transition-colors placeholder:text-[#A0A8C0]/60 focus:border-[#FF6B1A] focus:outline-none" />
        <button onClick={apply} disabled={applying || !instruction.trim() || !canUseAI}
          className="shrink-0 rounded-lg px-3 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
          style={BLUE_BUTTON}>
          {applying ? 'Applying...' : 'Apply with AI'}
        </button>
      </div>
      {!canUseAI && (
        <p className="mt-1.5 text-[11px]" style={{ color: '#A0A8C0' }}>
          Add your Gemini key in Settings to use AI edits.
        </p>
      )}
    </div>
  )
}

function Pages({ pages, zoom }) {
  return (
    <div className="flex flex-col items-center gap-5">
      {pages.map((pageB64, i) => (
        <div key={i} className="cv-page" style={{ width: `${(595 * zoom) / 100}px`, maxWidth: '100%' }}>
          <img src={`data:image/png;base64,${pageB64}`} alt={`Page ${i + 1}`}
            className="block h-auto w-full" draggable={false} />
        </div>
      ))}
    </div>
  )
}

function PageCount({ count }) {
  return (
    <span className="shrink-0 font-mono text-xs" style={{ color: '#9BA6BC' }}>
      {count} page{count > 1 ? 's' : ''}
    </span>
  )
}

function ZoomControls({ zoom, setZoom }) {
  return (
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
              color: zoom === v ? '#FF6B1A' : '#9BA6BC',
            }}>
            {v}%
          </button>
        ))}
      </div>
    </div>
  )
}

function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: 'rgba(255,107,26,0.3)', borderTopColor: '#FF6B1A' }} />
      <p className="font-mono text-xs" style={{ color: '#FF6B1A' }}>{label}</p>
    </div>
  )
}

function EditorMessage({ text }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-center font-mono text-xs"
      style={{ background: '#080C18', color: '#A0A8C0' }}>
      {text}
    </div>
  )
}

function EditorLoadError() {
  return <EditorMessage text="Could not load the editor. Check your connection, then reload the page." />
}

function DocTab({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick}
      className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all active:scale-[0.98]"
      style={{
        background: active ? 'rgba(255,107,26,0.14)' : 'transparent',
        border: active ? '1px solid rgba(255,107,26,0.4)' : '1px solid transparent',
        color: active ? '#fff' : '#9BA6BC',
      }}>
      <span aria-hidden="true">{icon}</span>{label}
    </button>
  )
}

function ZoomButton({ label, onClick }) {
  return (
    <button onClick={onClick}
      aria-label={label === '+' ? 'Zoom in' : 'Zoom out'}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold transition-all active:scale-95"
      style={{ background: '#171D2B', border: '1px solid #272E40', color: '#F2F4F8' }}>
      {label}
    </button>
  )
}
