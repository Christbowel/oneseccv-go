import { useState } from 'react'
import { LS } from '../config'

const FIELDS = [
  { key: 'identity',   label: '👤 Identity',            placeholder: 'Full name, date of birth, nationality…',            rows: 2 },
  { key: 'contact',    label: '📍 Contact & links',      placeholder: 'Email, phone, city, country, LinkedIn, GitHub…',    rows: 2 },
  { key: 'summary',    label: '💬 Profile summary',      placeholder: 'Describe yourself in 2-3 impactful sentences…',     rows: 3 },
  { key: 'education',  label: '🎓 Education',            placeholder: 'Degree, school, city, 2020-2023\nHonours, relevant courses…', rows: 4 },
  { key: 'experience', label: '💼 Work experience',      placeholder: 'Title, company, location, 06/2022-06/2023\n• Achievement 1\n• Achievement 2', rows: 5 },
  { key: 'projects',   label: '🚀 Projects',             placeholder: 'Project name | link\nDescription, tech stack, impact…', rows: 4 },
  { key: 'skills',     label: '🛠 Technical skills',     placeholder: 'Go, Python, React, Docker, Kubernetes, PostgreSQL…', rows: 3 },
  { key: 'languages',  label: '🗣 Languages',            placeholder: 'English (native), French (C1), German (B2)…',       rows: 2 },
  { key: 'hobbies',    label: '🎨 Interests',            placeholder: 'Open source, photography, chess…',                  rows: 2 },
]

const emptyFields = () => Object.fromEntries(FIELDS.map(f => [f.key, '']))

export default function TabManual({ onGenerate, isGenerating, resultMsg }) {
  // The form is long — never lose it to a refresh or an app switch on mobile.
  const [fields, setFields] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS.draft) || 'null')
      return saved ? { ...emptyFields(), ...saved } : emptyFields()
    } catch { return emptyFields() }
  })
  const [instruction, setInstruction] = useState('')

  const set = (key, val) => {
    setFields(prev => {
      const next = { ...prev, [key]: val }
      try { localStorage.setItem(LS.draft, JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
  }

  const buildUserData = () =>
    FIELDS.filter(f => fields[f.key].trim())
      .map(f => `${f.label.replace(/^\S+\s/, '').toUpperCase()}:\n${fields[f.key].trim()}`)
      .join('\n\n')

  const filled = FIELDS.filter(f => fields[f.key].trim()).length
  const canGenerate = filled >= 2 && !isGenerating

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Progress */}
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="label" style={{ marginBottom: 0 }}>Guided form</p>
            <span className="font-mono text-xs" style={{ color: '#A0A8C0' }}>{filled}/{FIELDS.length} filled</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full" style={{ background: '#1A2040' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(filled / FIELDS.length) * 100}%`, background: 'linear-gradient(90deg, #FF6B1A, #FF8C42)' }} />
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {FIELDS.map(field => (
            <div key={field.key}>
              <label className="label" htmlFor={`f-${field.key}`}>{field.label}</label>
              <textarea id={`f-${field.key}`} rows={field.rows} placeholder={field.placeholder}
                value={fields[field.key]} onChange={e => set(field.key, e.target.value)}
                disabled={isGenerating} className="textarea-field w-full" />
            </div>
          ))}

          <div>
            <label className="label" htmlFor="f-instruction">💡 Extra instructions</label>
            <textarea id="f-instruction" rows={2}
              placeholder="e.g. one page maximum, emphasise leadership, write it in French…"
              value={instruction} onChange={e => setInstruction(e.target.value)}
              disabled={isGenerating} className="textarea-field w-full" />
          </div>

          {resultMsg && !isGenerating && (
            <div className="animate-fade-in rounded-xl p-4"
              style={{
                background: resultMsg.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(255,107,26,0.08)',
                border: `1px solid ${resultMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,26,0.3)'}`,
                color: resultMsg.type === 'error' ? '#FCA5A5' : '#FF8C42',
              }}>
              <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{resultMsg.text}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky action */}
      <div className="shrink-0 px-4 py-3 sm:px-6"
        style={{ borderTop: '1px solid #1A2040', background: 'rgba(8,12,24,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="mx-auto w-full max-w-3xl">
          <button onClick={() => onGenerate(buildUserData(), instruction)} disabled={!canGenerate}
            className="w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: '#FF6B1A', color: '#fff', boxShadow: canGenerate ? '0 0 22px rgba(255,107,26,0.35)' : 'none' }}>
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating…
              </span>
            ) : '✨ Generate my CV'}
          </button>
          {filled < 2 && (
            <p className="mt-2 text-center font-mono text-xs" style={{ color: '#5A6280' }}>
              Fill at least 2 sections to generate
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
