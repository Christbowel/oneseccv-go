const inputStyle = {
  background: '#080C18', border: '1.5px solid #2A3050', borderRadius: 8,
  color: '#F5F5F5', width: '100%', padding: '10px 14px', fontSize: 13,
  outline: 'none', transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
}

export default function TabTemplates({ templates, selectedTpl, setSelectedTpl, goalJob, setGoalJob }) {
  const selected = templates.find(t => t.slug === selectedTpl)

  return (
    <div className="h-full flex gap-0 overflow-hidden">

      {/* ── Left: template list ── */}
      <div className="w-52 shrink-0 flex flex-col overflow-y-auto"
        style={{ borderRight: '1px solid #1A2040', background: 'rgba(8,12,24,0.5)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #1A2040' }}>
          <p className="label" style={{ marginBottom: 4 }}>Style</p>
          <p className="text-xs" style={{ color: '#A0A8C0' }}>Choose a CV design</p>
        </div>

        <nav className="p-2 flex flex-col gap-1">
          {templates.length === 0 ? (
            <p className="p-4 text-xs text-center" style={{ color: '#A0A8C0' }}>Loading templates...</p>
          ) : templates.map(tpl => (
            <button key={tpl.slug} onClick={() => setSelectedTpl(tpl.slug)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
              style={{
                background: tpl.slug === selectedTpl ? 'rgba(255,107,26,0.12)' : 'transparent',
                border: tpl.slug === selectedTpl ? '1px solid rgba(255,107,26,0.35)' : '1px solid transparent',
                color: tpl.slug === selectedTpl ? '#fff' : '#A0A8C0',
                boxShadow: tpl.slug === selectedTpl ? '0 0 12px rgba(255,107,26,0.1)' : 'none',
              }}>
              <span className="mr-2 text-xs" style={{ color: tpl.slug === selectedTpl ? '#FF6B1A' : '#5A6280' }}>▸</span>
              {tpl.name}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Right: options ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <div className="flex-1 p-5 overflow-hidden flex flex-col">
          <p className="label">Preview</p>
          <div className="flex-1 flex items-center justify-center rounded-xl overflow-hidden min-h-0"
            style={{ background: '#080C18', border: '1.5px solid #2A3050' }}>
            <div className="text-center py-12">
              <div className="text-4xl mb-3 opacity-20">📄</div>
              <p className="text-sm" style={{ color: '#A0A8C0' }}>
                {selected ? `Template: ${selected.name}` : 'Select a template'}
              </p>
              <p className="font-mono text-xs mt-1" style={{ color: '#5A6280' }}>
                Preview will appear after generation
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 p-5 space-y-4" style={{ borderTop: '1px solid #1A2040', background: 'rgba(8,12,24,0.6)' }}>
          <div>
            <label className="label">🎯 Target Position</label>
            <input type="text"
              placeholder="e.g. Cybersecurity Engineer, Data Scientist, Cloud Architect..."
              value={goalJob}
              onChange={e => setGoalJob(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#FF6B1A'}
              onBlur={e => e.target.style.borderColor = '#2A3050'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
