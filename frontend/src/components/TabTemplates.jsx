const DESCRIPTIONS = {
  jake:         'The classic one-page engineering CV. Dense, ATS-proof, universally accepted.',
  swe:          'Software-engineering focused: projects and stack get top billing.',
  'two-column': 'Sidebar for skills and contact, main column for experience.',
  elegant:      'Editorial serif look — stands out for design, product and research roles.',
  render:       'Modern and airy, with generous spacing and clear section rules.',
}

/** Template picker: a tap-friendly grid on mobile, a comfortable grid on desktop. */
export default function TabTemplates({ templates, selectedTpl, setSelectedTpl, onContinue }) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pb-8 pt-5 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-5">
          <h2 className="text-xl font-bold text-white sm:text-2xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            Pick a style
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#A0A8C0' }}>
            All templates compile to the same ATS-friendly LaTeX quality.
          </p>
        </header>

        {templates.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-28 animate-pulse rounded-xl" style={{ background: '#0A0F1E' }} />
            ))}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {templates.map(tpl => {
              const active = tpl.slug === selectedTpl
              return (
                <li key={tpl.slug}>
                  <button onClick={() => setSelectedTpl(tpl.slug)}
                    aria-pressed={active}
                    className="w-full rounded-xl p-4 text-left transition-all duration-150 active:scale-[0.99]"
                    style={{
                      background: active ? 'rgba(255,107,26,0.09)' : 'rgba(8,12,24,0.7)',
                      border: active ? '1.5px solid rgba(255,107,26,0.5)' : '1.5px solid #1A2040',
                      boxShadow: active ? '0 0 22px rgba(255,107,26,0.12)' : 'none',
                    }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                          {tpl.name}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: '#A0A8C0' }}>
                          {DESCRIPTIONS[tpl.slug] || 'A clean, professional LaTeX layout.'}
                        </p>
                      </div>
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]"
                        style={{
                          border: `1.5px solid ${active ? '#FF6B1A' : '#2A3050'}`,
                          background: active ? '#FF6B1A' : 'transparent',
                          color: '#fff',
                        }}>
                        {active ? '✓' : ''}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {onContinue && templates.length > 0 && (
          <button onClick={onContinue}
            className="mt-6 w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] lg:w-auto lg:px-10"
            style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 22px rgba(255,107,26,0.35)' }}>
            Continue →
          </button>
        )}
      </div>
    </div>
  )
}
