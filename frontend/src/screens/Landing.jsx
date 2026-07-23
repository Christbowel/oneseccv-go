import GoogleSignIn from '../components/GoogleSignIn'
import StarCanvas from '../components/StarCanvas'
import InstallCard from '../components/InstallCard'
import { useAuth } from '../auth/AuthProvider'
import { APP_NAME } from '../config'

const STEPS = [
  { icon: '📋', title: 'Paste the offer',   body: 'Drop in the job description. The AI mirrors its wording and priorities.' },
  { icon: '📄', title: 'Add your CV',       body: 'Import a PDF, DOCX or TXT, or fill the guided form.' },
  { icon: '⚡', title: 'CV + letter in 1s', body: 'A typeset LaTeX CV and a matching cover letter, ready to send.' },
]

const PERKS = [
  'A CV and a cover letter, from one job offer',
  'Rewritten for the exact role you paste',
  'Typeset with LaTeX, not a Word template',
  'Saved to your own Google Drive',
]

export default function Landing() {
  const { error } = useAuth()

  return (
    // h-full + overflow-y-auto: the scroll happens INSIDE this box, which
    // exactly matches #root's height - so the whole page is always reachable
    // on mobile (the global overflow:hidden used to clip it).
    <div className="relative h-full w-full overflow-y-auto" style={{ background: '#0A0E17' }}>
      <StarCanvas />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-6">

        {/* ── Fold: hero (left) + sign-in (right) on desktop ── */}
        <div className="flex flex-1 flex-col justify-center lg:grid lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-6">

          {/* Hero */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Logo />

            <h1 className="mt-6 text-[1.7rem] font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:mt-7 lg:text-[3rem]"
              style={{ fontFamily: 'Ubuntu, sans-serif' }}>
              A CV that gets{' '}
              <span style={{ color: '#FF6B1A' }}>callbacks</span>.<br />
              In one second.
            </h1>

            <p className="mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: '#9BA6BC' }}>
              Paste the job offer and add your old CV. {APP_NAME} writes you a
              typeset CV and a matching cover letter, aimed at that exact role.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {['ATS-friendly', 'LaTeX quality', 'CV + cover letter', 'Free'].map(tag => (
                <span key={tag} className="rounded-full px-3 py-1 font-mono text-[11px]"
                  style={{ background: 'rgba(255,107,26,0.08)', border: '1px solid rgba(255,107,26,0.25)', color: '#FF8C42' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Sign-in card */}
          <div className="mt-8 w-full lg:mt-0 lg:justify-self-end lg:max-w-md">
            <div className="rounded-2xl p-5 sm:p-6"
              style={{ background: 'rgba(8,12,24,0.88)', border: '1px solid #272E40', backdropFilter: 'blur(14px)' }}>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
                Sign in to start
              </h2>
              <p className="mt-1 text-sm" style={{ color: '#9BA6BC' }}>
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
                  <li key={p} className="flex items-start gap-2.5 text-sm" style={{ color: '#CDD3E1' }}>
                    <span className="mt-[3px] text-xs" style={{ color: '#10B981' }}>✓</span>{p}
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.18)' }}>
                <p className="text-[11px] leading-relaxed" style={{ color: '#8FA0B8' }}>
                  🔒 <strong style={{ color: '#CDD3E1' }}>Your CVs never touch our servers.</strong> They live in a
                  private folder of <em>your</em> Google Drive that only this app can read.
                </p>
              </div>
            </div>

            {/* Install without signing in first */}
            <div className="mt-4">
              <InstallCard />
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="mt-12 grid gap-3 sm:grid-cols-3 lg:mt-16 lg:gap-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-xl p-4 lg:p-5"
              style={{ background: 'rgba(8,12,24,0.6)', border: '1px solid #222838' }}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ background: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.28)' }}>
                  {s.icon}
                </span>
                <div>
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: '#6C7488' }}>STEP {i + 1}</p>
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>{s.title}</h3>
                </div>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: '#9BA6BC' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <footer className="mt-10 pb-2 text-center font-mono text-[11px]" style={{ color: '#6C7488' }}>
          © 2026 {APP_NAME} · built by <span style={{ color: '#FF6B1A' }}>Christ Bowel</span>
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
        <p className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Ubuntu, sans-serif' }}>OneSecCV</p>
        <p className="font-mono text-[11px]" style={{ color: '#FF6B1A' }}>AI + LaTeX engine</p>
      </div>
    </div>
  )
}
