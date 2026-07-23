import GoogleSignIn from '../components/GoogleSignIn'
import StarCanvas from '../components/StarCanvas'
import { useAuth } from '../auth/AuthProvider'
import { APP_NAME } from '../config'

const STEPS = [
  { icon: '📄', title: 'Import or type',   body: 'Drop your old CV (PDF, DOCX, TXT) or fill the guided form.' },
  { icon: '📋', title: 'Paste the offer',  body: 'Copy the job description in — the AI mirrors its wording and priorities.' },
  { icon: '⚡', title: 'LaTeX in 1 second', body: 'Compiled into a pixel-perfect, ATS-friendly PDF you can download.' },
]

const PERKS = [
  'CV + matching cover letter, one job offer',
  'Rewritten for the exact job you paste',
  'Typeset with LaTeX — not a Word template',
  'History saved in your own Google Drive',
]

export default function Landing() {
  const { error } = useAuth()

  return (
    <div className="relative min-h-[100dvh] w-full overflow-y-auto" style={{ background: '#050810' }}>
      <StarCanvas />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] lg:max-w-5xl lg:pt-16">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Logo />

          <h1 className="mt-7 text-[2.1rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            A CV that gets<br />
            <span style={{ color: '#FF6B1A' }}>callbacks</span> — in one second.
          </h1>

          <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed" style={{ color: '#A0A8C0' }}>
            Paste the job offer, drop your old CV, and {APP_NAME} rewrites it into a
            typeset LaTeX PDF aimed straight at that role.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {['ATS-friendly', 'LaTeX quality', 'Free'].map(tag => (
              <span key={tag} className="rounded-full px-3 py-1 font-mono text-[11px]"
                style={{ background: 'rgba(255,107,26,0.08)', border: '1px solid rgba(255,107,26,0.25)', color: '#FF8C42' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Sign in card ── */}
        <div className="mt-8 rounded-2xl p-5 sm:p-6 lg:mt-10 lg:max-w-md"
          style={{ background: 'rgba(8,12,24,0.88)', border: '1px solid #1A2040', backdropFilter: 'blur(14px)' }}>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Sign in to start
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#A0A8C0' }}>
            Free, no credit card. Your CVs follow you to every device.
          </p>

          <div className="mt-5">
            <GoogleSignIn />
          </div>

          {error && (
            <p className="mt-3 rounded-lg px-3 py-2 font-mono text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
              {error}
            </p>
          )}

          <ul className="mt-5 space-y-2">
            {PERKS.map(p => (
              <li key={p} className="flex items-start gap-2.5 text-sm" style={{ color: '#C6CCE0' }}>
                <span className="mt-[3px] text-xs" style={{ color: '#10B981' }}>✓</span>{p}
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <p className="text-[11px] leading-relaxed" style={{ color: '#8FA0B8' }}>
              🔒 <strong style={{ color: '#C6CCE0' }}>Your CVs never touch our servers.</strong> They are
              stored in a private folder of <em>your</em> Google Drive that only this app can read.
              Sign out — or revoke access in your Google account — and it is all gone.
            </p>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="mt-10 grid gap-3 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-xl p-4 lg:p-5"
              style={{ background: 'rgba(8,12,24,0.6)', border: '1px solid #131A34' }}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ background: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.28)' }}>
                  {s.icon}
                </span>
                <div>
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: '#5A6280' }}>STEP {i + 1}</p>
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{s.title}</h3>
                </div>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: '#A0A8C0' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <footer className="mt-10 pb-2 text-center font-mono text-[11px]" style={{ color: '#5A6280' }}>
          © 2026 {APP_NAME} — built by <span style={{ color: '#FF6B1A' }}>Christ Bowel</span>
        </footer>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="glow-orange flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: 'linear-gradient(135deg, #FF6B1A, #CC4A00)', border: '1px solid rgba(255,107,26,0.5)' }}>
        <svg viewBox="0 0 20 20" className="h-6 w-6 fill-white">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
        </svg>
      </div>
      <div className="text-left">
        <p className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>OneSecCV</p>
        <p className="font-mono text-[11px]" style={{ color: '#FF6B1A' }}>AI + LaTeX engine</p>
      </div>
    </div>
  )
}
