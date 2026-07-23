import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthProvider, useAuth } from './auth/AuthProvider'
import Landing from './screens/Landing'

import StarCanvas     from './components/StarCanvas'
import MobileNav      from './components/MobileNav'
import AccountMenu    from './components/AccountMenu'
import TargetPanel    from './components/TargetPanel'
import TabImport      from './components/TabImport'
import TabManual      from './components/TabManual'
import TabTemplates   from './components/TabTemplates'
import TabHistory     from './components/TabHistory'
import TabAPI         from './components/TabAPI'
import CVPreview      from './components/CVPreview'
import LoadingOverlay from './components/LoadingOverlay'
import InstallPrompt  from './components/InstallPrompt'

import { generateCV, generateCoverLetter, fixCompileError, refineCV } from './api/gemini'
import { compilePDF, compilePreview, getTemplate, health, listTemplates } from './lib/api'
import * as drive from './lib/drive'
import { NeedsSignIn } from './lib/googleAuth'
import { makeThumbnail } from './lib/thumbnail'
import { EV, initAnalytics, track, trackScreen } from './lib/analytics'
import { APP_NAME, LS } from './config'

export default function App() {
  useEffect(() => { initAnalytics() }, [])
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}

function Root() {
  const { isAuthenticated, booting } = useAuth()
  if (booting) return <Splash />
  return isAuthenticated ? <Workspace /> : <Landing />
}

// ── Workspace ───────────────────────────────────────────────

const SCREENS = {
  create:    { icon: '✨', label: 'Create'   },
  templates: { icon: '⬡',  label: 'Style'    },
  preview:   { icon: '📄', label: 'Preview'  },
  history:   { icon: '🗂',  label: 'My CVs'   },
  settings:  { icon: '⚙',  label: 'Settings' },
}

function Workspace() {
  const { user, sessionLost } = useAuth()

  const [screen, setScreen]         = useState('create')
  const [createMode, setCreateMode] = useState('import')

  const [templates, setTemplates]   = useState([])
  const [selectedTpl, setSelectedTpl] = useState(() => localStorage.getItem(LS.template) || '')
  const [compilerReady, setCompilerReady] = useState(null)

  const [goalJob, setGoalJob] = useState(() => localStorage.getItem(LS.goalJob) || '')
  const [jobDesc, setJobDesc] = useState(() => localStorage.getItem(LS.jobDesc) || '')
  const [apiKey, setApiKey]   = useState(() => localStorage.getItem(LS.apiKey) || '')

  const [isGenerating, setIsGenerating] = useState(false)
  const [resultMsg, setResultMsg]       = useState(null)
  const [toast, setToast]               = useState(null)

  const [previewPages, setPreviewPages]   = useState([])
  const [latexSource, setLatexSource]     = useState('')
  const [currentCvId, setCurrentCvId]     = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [historyKey, setHistoryKey]       = useState(0)
  const [cvCount, setCvCount]             = useState(null)

  // Cover letter (the matching half of the application pack).
  const [letterSource, setLetterSource]   = useState('')
  const [letterPages, setLetterPages]     = useState([])
  const [previewDoc, setPreviewDoc]       = useState('cv') // 'cv' | 'letter'

  // ── Boot ──
  useEffect(() => {
    health().then(h => setCompilerReady(Boolean(h)))
    listTemplates()
      .then(tpls => {
        if (!tpls?.length) return
        setTemplates(tpls)
        setSelectedTpl(prev => (tpls.some(t => t.slug === prev) ? prev : tpls[0].slug))
      })
      .catch(() => setCompilerReady(false))
    drive.listCVs().then(list => setCvCount(list.length)).catch(() => {})
  }, [])

  useEffect(() => { trackScreen(screen) }, [screen])
  useEffect(() => { localStorage.setItem(LS.template, selectedTpl) }, [selectedTpl])
  useEffect(() => { localStorage.setItem(LS.goalJob, goalJob) }, [goalJob])
  useEffect(() => { localStorage.setItem(LS.jobDesc, jobDesc) }, [jobDesc])

  const showToast = useCallback((type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 5500)
  }, [])

  const handleAuthError = useCallback((e) => {
    if (e instanceof NeedsSignIn) { sessionLost(e.message); return true }
    return false
  }, [sessionLost])

  const handleSaveKey = useCallback((key) => {
    localStorage.setItem(LS.apiKey, key)
    setApiKey(key)
    track(EV.keySaved)
    showToast('success', 'Gemini key activated — you are ready to generate.')
  }, [showToast])

  const handleClearKey = useCallback(() => {
    localStorage.removeItem(LS.apiKey)
    setApiKey('')
    showToast('success', 'Gemini key removed from this device.')
  }, [showToast])

  // ── Save to the user's Drive ──
  // `extra` carries fields beyond the CV itself (e.g. coverLetterSource) so a
  // letter is stored in the same "application pack" entry as its CV.
  const saveToDrive = useCallback(async (source, pages, { id, extra } = {}) => {
    try {
      const thumbnail = await makeThumbnail(pages?.[0])
      const entry = await drive.saveCV({
        id,
        title: goalJob.trim() || `CV — ${new Date().toLocaleDateString()}`,
        template: selectedTpl,
        targetJob: goalJob.trim(),
        source,
        thumbnail,
        ...extra,
      })
      setCurrentCvId(entry.id)
      setHistoryKey(k => k + 1)
      drive.listCVs().then(list => setCvCount(list.length)).catch(() => {})
      track(EV.saveCloud, { template: selectedTpl || 'unknown' })
      return entry
    } catch (e) {
      if (handleAuthError(e)) return null
      showToast('error', `Saved locally only — Drive sync failed: ${e.message}`)
      return null
    }
  }, [goalJob, selectedTpl, handleAuthError, showToast])

  // ── Generate ──
  const handleGenerate = useCallback(async (userData, instruction = '') => {
    if (!apiKey)       { showToast('error', 'Add your free Gemini key in Settings first.'); setScreen('settings'); return }
    if (!selectedTpl)  { showToast('error', 'Pick a template first.'); setScreen('templates'); return }
    if (compilerReady === false) { showToast('error', 'The compilation server is unreachable right now.'); return }

    setIsGenerating(true)
    setResultMsg(null)
    track(EV.generateStart, { template: selectedTpl, has_job_description: jobDesc.trim().length > 0 })

    try {
      const tmpl = await getTemplate(selectedTpl)
      let source = await generateCV(apiKey, {
        userData,
        instruction,
        templateSource: tmpl.source,
        targetJob: goalJob,
        jobDescription: jobDesc,
      })

      // Compile, letting the AI repair its own LaTeX up to 3 times.
      const maxAttempts = 3
      let lastError = ''

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const preview = await compilePreview(source)
          setLatexSource(source)
          setPreviewPages(preview.pages)
          setCurrentCvId(null)
          // A fresh CV invalidates any letter written for the previous one.
          setLetterSource('')
          setLetterPages([])
          setPreviewDoc('cv')
          setScreen('preview')
          setResultMsg({ type: 'success', text: '✨ CV generated successfully!' })
          showToast('success', '✨ CV ready — saving to your Drive…')
          track(EV.generateOk, { template: selectedTpl, attempts: attempt })
          saveToDrive(source, preview.pages)
          return
        } catch (compileErr) {
          lastError = compileErr.message
          if (attempt === maxAttempts) break
          try {
            source = await fixCompileError(apiKey, source, lastError)
          } catch { break }
        }
      }

      setResultMsg({ type: 'error', text: `❌ Compilation failed after ${maxAttempts} attempts.\n\n${lastError}` })
      showToast('error', 'Compilation failed — try another template.')
      track(EV.generateFail, { reason: 'compile', template: selectedTpl })
    } catch (e) {
      const msg = String(e?.message || e)
      setResultMsg({ type: 'error', text: `❌ ${msg}` })
      showToast('error', msg)
      track(EV.generateFail, { reason: 'ai', template: selectedTpl })
    } finally {
      setIsGenerating(false)
    }
  }, [apiKey, selectedTpl, compilerReady, goalJob, jobDesc, showToast, saveToDrive])

  // ── Refine whichever document is on screen ──
  const handleRefine = useCallback(async (instruction) => {
    if (!apiKey) { showToast('error', 'Add your Gemini key in Settings to refine.'); setScreen('settings'); return }
    const isLetter = previewDoc === 'letter'
    const current = isLetter ? letterSource : latexSource
    if (!current) return

    setPreviewLoading(true)
    try {
      const source = await refineCV(apiKey, current, instruction)
      const preview = await compilePreview(source)
      if (isLetter) {
        setLetterSource(source)
        setLetterPages(preview.pages)
        saveToDrive(latexSource, previewPages, { id: currentCvId, extra: { coverLetterSource: source } })
      } else {
        setLatexSource(source)
        setPreviewPages(preview.pages)
        saveToDrive(source, preview.pages, { id: currentCvId })
      }
      showToast('success', 'Changes applied!')
      track(EV.refine, { doc: isLetter ? 'letter' : 'cv' })
    } catch (e) {
      showToast('error', String(e?.message || e))
    } finally {
      setPreviewLoading(false)
    }
  }, [apiKey, previewDoc, letterSource, latexSource, previewPages, currentCvId, showToast, saveToDrive])

  // ── Generate the matching cover letter ──
  const handleGenerateLetter = useCallback(async () => {
    if (!apiKey) { showToast('error', 'Add your Gemini key in Settings first.'); setScreen('settings'); return }
    if (!latexSource) return

    setPreviewLoading(true)
    track(EV.letterStart, { has_job_description: jobDesc.trim().length > 0 })
    try {
      let source = await generateCoverLetter(apiKey, {
        cvSource: latexSource,
        jobDescription: jobDesc,
        targetJob: goalJob,
      })

      const maxAttempts = 3
      let lastError = ''
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const preview = await compilePreview(source)
          setLetterSource(source)
          setLetterPages(preview.pages)
          setPreviewDoc('letter')
          showToast('success', '✉ Cover letter ready — saved to your Drive.')
          track(EV.letterOk, { attempts: attempt })
          saveToDrive(latexSource, previewPages, { id: currentCvId, extra: { coverLetterSource: source } })
          return
        } catch (compileErr) {
          lastError = compileErr.message
          if (attempt === maxAttempts) break
          try { source = await fixCompileError(apiKey, source, lastError) } catch { break }
        }
      }
      showToast('error', `Cover letter compilation failed.\n\n${lastError}`)
      track(EV.letterFail, { reason: 'compile' })
    } catch (e) {
      showToast('error', String(e?.message || e))
      track(EV.letterFail, { reason: 'ai' })
    } finally {
      setPreviewLoading(false)
    }
  }, [apiKey, latexSource, jobDesc, goalJob, previewPages, currentCvId, showToast, saveToDrive])

  // ── Download (whichever document is on screen) ──
  const handleDownload = useCallback(async () => {
    const isLetter = previewDoc === 'letter'
    const source = isLetter ? letterSource : latexSource
    if (!source) return
    setPreviewLoading(true)
    try {
      const blob = await compilePDF(source)
      const slug = (goalJob.trim() || 'application').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
      const name = `${slug}-${isLetter ? 'cover-letter' : 'cv'}-oneseccv.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      track(isLetter ? EV.downloadLetter : EV.download, { template: selectedTpl || 'unknown' })
    } catch (e) {
      showToast('error', String(e?.message || e))
    } finally {
      setPreviewLoading(false)
    }
  }, [previewDoc, letterSource, latexSource, goalJob, selectedTpl, showToast])

  // ── Open one from history (CV, plus its letter if the pack has one) ──
  const handleOpenFromHistory = useCallback(async (cv) => {
    setPreviewLoading(true)
    setScreen('preview')
    setPreviewDoc('cv')
    setLetterSource('')
    setLetterPages([])
    try {
      const preview = await compilePreview(cv.source)
      setLatexSource(cv.source)
      setPreviewPages(preview.pages)
      setCurrentCvId(cv.id)
      if (cv.targetJob) setGoalJob(cv.targetJob)
      if (cv.template) setSelectedTpl(cv.template)

      // Lazily compile the stored letter so the CV shows without waiting.
      if (cv.coverLetterSource) {
        setLetterSource(cv.coverLetterSource)
        compilePreview(cv.coverLetterSource)
          .then(lp => setLetterPages(lp.pages))
          .catch(() => { /* letter stays regenerable via the button */ })
      }
    } catch (e) {
      showToast('error', `Could not re-render this CV: ${e.message}`)
      setScreen('history')
    } finally {
      setPreviewLoading(false)
    }
  }, [showToast])

  const navItems = useMemo(() => {
    const ids = ['create', 'templates', 'preview', 'history', 'settings']
    return ids.map(id => ({ id, ...SCREENS[id], disabled: id === 'preview' && previewPages.length === 0 }))
  }, [previewPages.length])

  const goto = useCallback((id) => {
    if (id === 'preview' && previewPages.length === 0) {
      showToast('error', 'Generate a CV first.')
      return
    }
    setScreen(id)
  }, [previewPages.length, showToast])

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden" style={{ background: '#050810' }}>
      <StarCanvas />

      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-6"
        style={{
          background: 'rgba(8,12,24,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1A2040',
          paddingTop: 'max(0.625rem, env(safe-area-inset-top))',
        }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="glow-orange flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #FF6B1A, #CC4A00)', border: '1px solid rgba(255,107,26,0.5)' }}>
            <svg viewBox="0 0 20 20" className="h-4.5 w-4.5 fill-white" style={{ width: 18, height: 18 }}>
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {APP_NAME}
            </p>
            <p className="hidden truncate font-mono text-[10px] sm:block" style={{ color: '#FF6B1A' }}>
              Hi {user?.name?.split(' ')[0] || 'there'} — let's get you hired
            </p>
          </div>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map(item => (
            <button key={item.id} onClick={() => goto(item.id)}
              disabled={item.disabled}
              className={`tab-btn ${screen === item.id ? 'active' : ''} disabled:opacity-30`}>
              <span className="mr-1.5" aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <StatusPill label="AI" ready={Boolean(apiKey)} />
          <StatusPill label="LaTeX" ready={compilerReady} />
          {/* On mobile the preview screen carries its own full-width download
              bar, so this would just be a second button fighting for space. */}
          {previewPages.length > 0 && (
            <button onClick={handleDownload}
              className="hidden rounded-lg px-4 py-2 text-xs font-bold transition-all active:scale-95 lg:block"
              style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 16px rgba(255,107,26,0.4)' }}>
              Download PDF ↓
            </button>
          )}
          <AccountMenu onOpenSettings={() => setScreen('settings')} cvCount={cvCount} />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {screen === 'create' && (
          <div className="flex h-full flex-col">
            <div className="shrink-0 px-4 pt-4 sm:px-6">
              <div className="mx-auto w-full max-w-3xl space-y-3">
                <TargetPanel
                  goalJob={goalJob} setGoalJob={setGoalJob}
                  jobDesc={jobDesc} setJobDesc={setJobDesc}
                  disabled={isGenerating}
                />
                <SegmentedControl
                  value={createMode}
                  onChange={setCreateMode}
                  options={[
                    { id: 'import', label: '↗ Import a CV' },
                    { id: 'form',   label: '✎ Fill a form' },
                  ]}
                />
              </div>
            </div>
            <div className="min-h-0 flex-1">
              {createMode === 'import'
                ? <TabImport onGenerate={handleGenerate} isGenerating={isGenerating} resultMsg={resultMsg} />
                : <TabManual onGenerate={handleGenerate} isGenerating={isGenerating} resultMsg={resultMsg} />}
            </div>
          </div>
        )}

        {screen === 'templates' && (
          <TabTemplates templates={templates} selectedTpl={selectedTpl} setSelectedTpl={setSelectedTpl}
            onContinue={() => setScreen('create')} />
        )}

        {screen === 'preview' && (
          <CVPreview
            doc={previewDoc}
            onDocChange={setPreviewDoc}
            cvPages={previewPages}
            letterPages={letterPages}
            hasLetter={Boolean(letterSource)}
            onGenerateLetter={handleGenerateLetter}
            onDownload={handleDownload}
            onRefine={handleRefine}
            loading={previewLoading}
            canRefine={Boolean(apiKey)}
          />
        )}

        {screen === 'history' && (
          <TabHistory onOpen={handleOpenFromHistory} refreshKey={historyKey} showToast={showToast} />
        )}

        {screen === 'settings' && (
          <TabAPI currentKey={apiKey} onSave={handleSaveKey} onClear={handleClearKey} showToast={showToast} />
        )}

        {isGenerating && <LoadingOverlay />}
      </main>

      {toast && <Toast type={toast.type} text={toast.text} onClose={() => setToast(null)} />}
      {/* Only ask to install once they have something worth coming back for —
          before that the banner just sits on top of the primary CTA. */}
      {previewPages.length > 0 && !isGenerating && screen !== 'preview' && <InstallPrompt />}

      <MobileNav items={navItems} active={screen} onSelect={goto} />
    </div>
  )
}

// ── Small shared pieces ─────────────────────────────────────

function Splash() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-4" style={{ background: '#050810' }}>
      <div className="glow-orange flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #FF6B1A, #CC4A00)' }}>
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
      <p className="font-mono text-xs tracking-widest" style={{ color: '#FF6B1A' }}>ONESECCV</p>
    </div>
  )
}

function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl p-1"
      style={{ background: '#0A0F1E', border: '1px solid #1A2040' }}>
      {options.map(opt => (
        <button key={opt.id} onClick={() => onChange(opt.id)}
          className="rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            background: value === opt.id ? 'rgba(255,107,26,0.14)' : 'transparent',
            border: value === opt.id ? '1px solid rgba(255,107,26,0.4)' : '1px solid transparent',
            color: value === opt.id ? '#fff' : '#A0A8C0',
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function StatusPill({ label, ready }) {
  const color = ready === null ? '#5A6280' : ready ? '#10B981' : '#EF4444'
  return (
    <div className="hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[11px] sm:flex"
      style={{ border: `1px solid ${color}59`, background: `${color}14`, color }}>
      <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'animate-pulse-slow' : ''}`} style={{ background: color }} />
      {label}
    </div>
  )
}

function Toast({ type, text, onClose }) {
  const isErr = type === 'error'
  return (
    // Top on phones — the bottom of the screen belongs to the nav and the
    // primary CTA. Bottom-right on desktop, where that is the convention.
    <div className="animate-slide-up fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-start gap-3 rounded-xl p-4
                    top-[calc(env(safe-area-inset-top)+10.5rem)]
                    lg:bottom-6 lg:left-auto lg:right-6 lg:top-auto lg:translate-x-0"
      style={{
        background: isErr ? 'rgba(40,10,12,0.96)' : 'rgba(28,16,6,0.96)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,0.4)' : 'rgba(255,107,26,0.4)'}`,
        color: isErr ? '#FCA5A5' : '#FFB27A',
        backdropFilter: 'blur(10px)',
      }}
      role="status">
      <span className="mt-0.5 text-base" aria-hidden="true">{isErr ? '✕' : '✓'}</span>
      <p className="flex-1 whitespace-pre-line text-sm leading-snug">{text}</p>
      <button onClick={onClose} aria-label="Dismiss" className="ml-1 text-xs transition-colors hover:text-white">✕</button>
    </div>
  )
}
