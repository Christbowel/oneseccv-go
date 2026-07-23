import { useState } from 'react'

/**
 * The job the CV is aimed at. The description is pasted, not fetched: nearly
 * every job board sits behind a login, so a URL would fail more often than it
 * would work - and a paste takes the user two seconds.
 */
export default function TargetPanel({ goalJob, setGoalJob, jobDesc, setJobDesc, disabled }) {
  const [expanded, setExpanded] = useState(false)
  const chars = jobDesc.trim().length
  const strength = chars === 0 ? 0 : chars < 300 ? 1 : chars < 1200 ? 2 : 3

  return (
    <section className="rounded-xl p-4"
      style={{ background: 'rgba(8,12,24,0.7)', border: '1px solid #272E40' }}>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="label" style={{ marginBottom: 2 }}>🎯 Target job</p>
          <p className="text-xs" style={{ color: '#828BA0' }}>
            What the AI aims your CV at
          </p>
        </div>
        <StrengthPill strength={strength} />
      </div>

      <input
        type="text"
        inputMode="text"
        autoComplete="organization-title"
        placeholder="Job title - e.g. Cybersecurity Engineer"
        value={goalJob}
        onChange={e => setGoalJob(e.target.value)}
        disabled={disabled}
        className="input-field"
      />

      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        className="mt-3 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors active:scale-[0.99]"
        style={{ background: '#171D2B', border: '1px solid #272E40' }}>
        <span className="flex items-center gap-2 text-sm" style={{ color: chars ? '#F2F4F8' : '#9BA6BC' }}>
          <span aria-hidden="true">📋</span>
          {chars ? `Job description - ${chars.toLocaleString()} characters` : 'Paste the job description'}
          {chars > 0 && <span style={{ color: '#10B981' }}>✓</span>}
        </span>
        <span className="text-xs" style={{ color: '#828BA0' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="animate-fade-in mt-3">
          <textarea
            rows={7}
            placeholder={
              'Copy the whole offer here - requirements, responsibilities, stack…\n\n' +
              'The AI mirrors its exact wording, which is what most ATS filters match on.'
            }
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            disabled={disabled}
            className="textarea-field w-full"
            style={{ minHeight: 150 }}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] leading-snug" style={{ color: '#6C7488' }}>
              Paste the text, not the link - job pages are usually behind a login.
            </p>
            {chars > 0 && (
              <button type="button" onClick={() => setJobDesc('')} disabled={disabled}
                className="shrink-0 text-[11px] underline" style={{ color: '#828BA0' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function StrengthPill({ strength }) {
  const map = [
    { label: 'No offer',   color: '#6C7488', bg: 'rgba(90,98,128,0.12)' },
    { label: 'Thin',       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Good',       color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Excellent',  color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
  ][strength]

  return (
    <span className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider"
      style={{ color: map.color, background: map.bg, border: `1px solid ${map.color}44` }}>
      {map.label}
    </span>
  )
}
