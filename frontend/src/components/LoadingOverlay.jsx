import { useEffect, useState } from 'react'

const STEPS = [
  { icon: '🤖', text: 'Reading your profile',   sub: 'The AI parses everything you provided' },
  { icon: '🎯', text: 'Matching the job offer', sub: 'Ranking your experience against the posting' },
  { icon: '✍️', text: 'Writing the LaTeX',      sub: 'Rewriting your bullets as impact statements' },
  { icon: '⚙️', text: 'Compiling the PDF',      sub: 'pdflatex is typesetting your document' },
  { icon: '✨', text: 'Finishing up',           sub: 'Almost there — rendering the preview' },
]

export default function LoadingOverlay() {
  const [stepIndex, setStepIndex] = useState(0)
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const s = setInterval(() => setStepIndex(i => Math.min(i + 1, STEPS.length - 1)), 3200)
    const d = setInterval(() => setDots(v => (v + 1) % 4), 500)
    return () => { clearInterval(s); clearInterval(d) }
  }, [])

  const step = STEPS[stepIndex]
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  return (
    <div className="animate-fade-in scanline-fx absolute inset-0 z-40 flex items-center justify-center px-4"
      style={{ background: 'rgba(5,8,16,0.93)', backdropFilter: 'blur(16px)' }}
      role="status" aria-live="polite">

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: 'rgba(8,12,24,0.96)',
          border: '1px solid rgba(255,107,26,0.3)',
          boxShadow: '0 0 60px rgba(255,107,26,0.15), 0 0 120px rgba(255,107,26,0.05)',
        }}>

        <div className="absolute left-0 top-0 h-12 w-12"
          style={{ borderTop: '2px solid rgba(255,107,26,0.4)', borderLeft: '2px solid rgba(255,107,26,0.4)', borderRadius: '12px 0 0 0' }} />
        <div className="absolute bottom-0 right-0 h-12 w-12"
          style={{ borderBottom: '2px solid rgba(30,111,255,0.4)', borderRight: '2px solid rgba(30,111,255,0.4)', borderRadius: '0 0 12px 0' }} />

        <div className="mb-5 flex justify-center">
          <div className="glow-orange relative flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.35)' }}>
            <span className="text-2xl">{step.icon}</span>
            <div className="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent"
              style={{ borderTopColor: '#FF6B1A' }} />
          </div>
        </div>

        <h2 className="mb-0.5 text-center text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          OneSecCV
        </h2>
        <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest" style={{ color: '#FF6B1A' }}>
          AI engine at work
        </p>

        <div className="mb-2 flex min-h-[3rem] flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {step.text}{'.'.repeat(dots)}
          </p>
          <p className="mt-1 font-mono text-xs" style={{ color: '#A0A8C0' }}>{step.sub}</p>
        </div>

        <div className="mb-3 mt-6">
          <div className="mb-1.5 flex justify-between">
            <span className="font-mono text-xs" style={{ color: '#5A6280' }}>Progress</span>
            <span className="font-mono text-xs" style={{ color: '#FF6B1A' }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full" style={{ background: '#1A2040' }}>
            <div className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FF6B1A, #FF8C42)', boxShadow: '0 0 10px rgba(255,107,26,0.5)' }} />
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === stepIndex ? 24 : 8,
                background: i === stepIndex ? '#FF6B1A' : i < stepIndex ? 'rgba(255,107,26,0.3)' : '#1A2040',
              }} />
          ))}
        </div>

        <p className="mt-5 text-center text-[11px]" style={{ color: '#5A6280' }}>
          Keep this screen open — it usually takes 10 to 30 seconds.
        </p>
      </div>
    </div>
  )
}
