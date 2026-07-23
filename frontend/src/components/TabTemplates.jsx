import { useState } from 'react'

const DESCRIPTIONS = {
  jake:         'The classic one-page engineering CV. Dense, ATS-proof, universally accepted.',
  swe:          'Software-engineering focused: projects and stack get top billing.',
  'two-column': 'Sidebar for skills and contact, main column for experience.',
  elegant:      'Editorial serif look — stands out for design, product and research roles.',
  render:       'Modern and airy, with generous spacing and clear section rules.',
}

// Slugs that ship with a rendered preview image in /public/previews.
const HAS_PREVIEW = new Set(['jake', 'swe', 'two-column', 'elegant', 'render'])

/** Template picker with real rendered previews — the "pick a look" moment. */
export default function TabTemplates({ templates, selectedTpl, setSelectedTpl, onContinue }) {
  const [zoom, setZoom] = useState(null) // slug of the template shown full-size

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pb-28 pt-5 sm:px-6 lg:pb-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-5">
          <h2 className="text-xl font-bold text-white sm:text-2xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            Pick a style
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#A0A8C0' }}>
            Tap a design to select it, or the ⤢ to see it full-size. All are ATS-friendly LaTeX.
          </p>
        </header>

        {templates.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl" style={{ background: '#0A0F1E' }} />
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {templates.map(tpl => {
              const active = tpl.slug === selectedTpl
              const hasImg = HAS_PREVIEW.has(tpl.slug)
              return (
                <li key={tpl.slug}>
                  <div className="group relative overflow-hidden rounded-xl transition-all duration-200"
                    style={{
                      border: active ? '2px solid #FF6B1A' : '2px solid #1A2040',
                      boxShadow: active ? '0 0 26px rgba(255,107,26,0.22)' : 'none',
                    }}>
                    {/* Preview image */}
                    <button onClick={() => setSelectedTpl(tpl.slug)}
                      aria-pressed={active} aria-label={`Select ${tpl.name}`}
                      className="block w-full text-left">
                      <div className="relative aspect-[3/4] w-full overflow-hidden" style={{ background: '#fff' }}>
                        {hasImg ? (
                          <img
                            src={`/previews/${tpl.slug}.webp`}
                            alt={`${tpl.name} preview`}
                            loading="lazy"
                            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2"
                            style={{ background: '#0A0F1E' }}>
                            <span className="text-3xl opacity-30">📄</span>
                            <span className="font-mono text-[10px]" style={{ color: '#5A6280' }}>preview soon</span>
                          </div>
                        )}
                        {/* Selected check */}
                        {active && (
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                            style={{ background: '#FF6B1A', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                            ✓
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Zoom button */}
                    {hasImg && (
                      <button onClick={() => setZoom(tpl.slug)}
                        aria-label={`Enlarge ${tpl.name}`}
                        className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100"
                        style={{ background: 'rgba(5,8,16,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                        ⤢
                      </button>
                    )}

                    {/* Caption */}
                    <div className="px-3 py-2.5" style={{ background: 'rgba(8,12,24,0.9)' }}>
                      <p className="truncate text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {tpl.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug" style={{ color: '#8A93AD' }}>
                        {DESCRIPTIONS[tpl.slug] || 'A clean, professional LaTeX layout.'}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Sticky continue bar (mobile) */}
      {onContinue && templates.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] pt-3 lg:static lg:mt-6 lg:px-0 lg:pb-0"
          style={{ background: 'linear-gradient(to top, #050810 55%, transparent)' }}>
          <div className="mx-auto max-w-4xl">
            <button onClick={onContinue}
              className="w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] lg:w-auto lg:px-10"
              style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 22px rgba(255,107,26,0.35)' }}>
              Continue with {templates.find(t => t.slug === selectedTpl)?.name || 'this style'} →
            </button>
          </div>
        </div>
      )}

      {/* Full-size lightbox */}
      {zoom && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
          style={{ background: 'rgba(5,8,16,0.92)' }} onClick={() => setZoom(null)}>
          <img src={`/previews/${zoom}.webp`} alt=""
            className="max-h-[80vh] w-auto rounded-lg"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()} />
          <div className="mt-4 flex gap-3" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoom(null)}
              className="rounded-lg px-5 py-2.5 text-sm" style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#A0A8C0' }}>
              Close
            </button>
            <button onClick={() => { setSelectedTpl(zoom); setZoom(null) }}
              className="rounded-lg px-5 py-2.5 text-sm font-bold uppercase tracking-widest"
              style={{ background: '#FF6B1A', color: '#fff' }}>
              Use this style
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
