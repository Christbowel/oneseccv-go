import { useEffect, useState } from 'react'
import { LS } from '../config'
import { track } from '../lib/analytics'

const SLIDES = [
  {
    icon: '📋',
    title: 'Paste the job offer',
    body: 'Copy the posting into OneSecCV. The AI mirrors its exact wording — the words most ATS filters actually match on.',
    art: 'offer',
  },
  {
    icon: '📄',
    title: 'Drop your old CV',
    body: 'Import a PDF, DOCX or TXT — or fill the guided form. Your experience gets rewritten into sharp, quantified impact bullets.',
    art: 'cv',
  },
  {
    icon: '✨',
    title: 'Get a full application pack',
    body: 'A typeset LaTeX CV and a matching cover letter, saved to your own Google Drive. Install the app to keep it one tap away.',
    art: 'pack',
  },
]

/** Three-card first-run tour. Shown once, then remembered in localStorage. */
export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const last = i === SLIDES.length - 1

  useEffect(() => { track('onboarding_view', { step: i + 1 }) }, [i])

  const finish = () => {
    localStorage.setItem(LS.seenOnboarding, String(Date.now()))
    track('onboarding_done', { completed_step: i + 1 })
    setLeaving(true)
    setTimeout(onDone, 220)
  }

  const next = () => (last ? finish() : setI(v => v + 1))
  const slide = SLIDES[i]

  return (
    <div className={`fixed inset-0 z-[60] flex items-end justify-center sm:items-center ${leaving ? '' : 'animate-fade-in'}`}
      style={{ background: 'rgba(5,8,16,0.9)', backdropFilter: 'blur(10px)', opacity: leaving ? 0 : 1, transition: 'opacity 0.2s' }}>
      <div className="w-full max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl"
        style={{ background: '#080C18', border: '1px solid #1A2040', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>

        {/* Skip */}
        <div className="flex justify-end px-4 pt-4">
          <button onClick={finish} className="text-xs" style={{ color: '#5A6280' }}>Skip</button>
        </div>

        {/* Art */}
        <div key={i} className="animate-fade-in mx-auto mt-2 flex h-40 w-full max-w-[19rem] items-center justify-center px-6">
          <SlideArt kind={slide.art} />
        </div>

        {/* Copy */}
        <div key={`t-${i}`} className="animate-fade-in px-6 pt-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
            style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.3)' }}>
            {slide.icon}
          </div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{slide.title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed" style={{ color: '#A0A8C0' }}>{slide.body}</p>
        </div>

        {/* Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {SLIDES.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Go to step ${idx + 1}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: idx === i ? 22 : 7, background: idx === i ? '#FF6B1A' : '#2A3050' }} />
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-5 pt-5">
          <button onClick={next}
            className="w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98]"
            style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 22px rgba(255,107,26,0.35)' }}>
            {last ? "Let's build my CV" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Small inline SVG illustrations — no external assets, theme-matched. */
function SlideArt({ kind }) {
  const orange = '#FF6B1A'
  const dim = '#1E2748'
  const line = '#2A3550'

  if (kind === 'offer') {
    return (
      <svg viewBox="0 0 240 150" className="w-full" role="img" aria-label="Pasting a job offer">
        <rect x="30" y="18" width="180" height="118" rx="10" fill="#0A0F1E" stroke={line} />
        <rect x="46" y="34" width="86" height="9" rx="4.5" fill={orange} />
        <rect x="46" y="54" width="148" height="6" rx="3" fill={dim} />
        <rect x="46" y="68" width="148" height="6" rx="3" fill={dim} />
        <rect x="46" y="82" width="120" height="6" rx="3" fill={dim} />
        <rect x="46" y="100" width="72" height="6" rx="3" fill={line} />
        <g transform="translate(150 96)">
          <rect x="0" y="0" width="44" height="26" rx="6" fill={orange} opacity="0.15" stroke={orange} />
          <path d="M10 13 h24 M25 5 l9 8 l-9 8" stroke={orange} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    )
  }
  if (kind === 'cv') {
    return (
      <svg viewBox="0 0 240 150" className="w-full" role="img" aria-label="Importing a CV">
        <rect x="20" y="26" width="92" height="104" rx="8" fill="#0A0F1E" stroke={line} />
        <rect x="32" y="40" width="40" height="7" rx="3.5" fill={line} />
        <rect x="32" y="56" width="68" height="5" rx="2.5" fill={dim} />
        <rect x="32" y="68" width="68" height="5" rx="2.5" fill={dim} />
        <rect x="32" y="80" width="52" height="5" rx="2.5" fill={dim} />
        <path d="M124 78 h28 M143 68 l11 10 l-11 10" stroke={orange} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="164" y="26" width="56" height="104" rx="8" fill="#0A0F1E" stroke={orange} />
        <rect x="174" y="40" width="30" height="7" rx="3.5" fill={orange} />
        <rect x="174" y="56" width="36" height="5" rx="2.5" fill={line} />
        <rect x="174" y="66" width="36" height="5" rx="2.5" fill={line} />
        <rect x="174" y="82" width="24" height="5" rx="2.5" fill={line} />
      </svg>
    )
  }
  // pack
  return (
    <svg viewBox="0 0 240 150" className="w-full" role="img" aria-label="CV and cover letter">
      <g transform="rotate(-6 70 75)">
        <rect x="34" y="26" width="86" height="104" rx="8" fill="#0A0F1E" stroke={line} />
        <rect x="46" y="40" width="34" height="7" rx="3.5" fill={orange} />
        <rect x="46" y="56" width="62" height="5" rx="2.5" fill={dim} />
        <rect x="46" y="66" width="62" height="5" rx="2.5" fill={dim} />
        <rect x="46" y="82" width="44" height="5" rx="2.5" fill={dim} />
      </g>
      <g transform="rotate(6 168 75)">
        <rect x="126" y="26" width="86" height="104" rx="8" fill="#0A0F1E" stroke={orange} />
        <rect x="138" y="42" width="46" height="8" rx="4" fill={orange} />
        <rect x="138" y="60" width="62" height="5" rx="2.5" fill={line} />
        <rect x="138" y="72" width="62" height="5" rx="2.5" fill={line} />
        <rect x="138" y="84" width="62" height="5" rx="2.5" fill={line} />
        <rect x="138" y="104" width="30" height="5" rx="2.5" fill={line} />
      </g>
    </svg>
  )
}
