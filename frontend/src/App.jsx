import { useState, useEffect, useCallback } from 'react'

import StarCanvas     from './components/StarCanvas'
import TabImport      from './components/TabImport'
import TabManual      from './components/TabManual'
import TabTemplates   from './components/TabTemplates'
import TabAPI         from './components/TabAPI'
import LoadingOverlay from './components/LoadingOverlay'
import CVPreview      from './components/CVPreview'

import { generateCV, fixCompileError } from './api/gemini'
import { listTemplates, getTemplate, compilePreview, compilePDF, healthCheck } from './api/compiler'

const TABS = [
  { id: 'templates', label: '⬡ Templates' },
  { id: 'import',    label: '↗ Import'    },
  { id: 'manual',    label: '✎ Manual'    },
  { id: 'api',       label: '⚙ Settings'  },
]

export default function App() {
  const [activeTab, setActiveTab]     = useState('templates')
  const [templates, setTemplates]     = useState([])
  const [selectedTpl, setSelectedTpl] = useState('')
  const [goalJob, setGoalJob]         = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultMsg, setResultMsg]     = useState(null)
  const [toast, setToast]             = useState(null)

  const [apiKey, setApiKey]           = useState(() => localStorage.getItem('oneseccv_apikey') || '')
  const [apiReady, setApiReady]       = useState(false)
  const [compilerReady, setCompilerReady] = useState(false)

  // CV preview
  const [showPreview, setShowPreview] = useState(false)
  const [previewPages, setPreviewPages] = useState([])
  const [typstSource, setTypstSource] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (apiKey) setApiReady(true)
    healthCheck().then(setCompilerReady)
    listTemplates()
      .then(tpls => { if (tpls?.length) { setTemplates(tpls); setSelectedTpl(tpls[0].slug) } })
      .catch(e => showToast('error', String(e)))
  }, [])

  const showToast = useCallback((type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 5500)
  }, [])

  const handleSaveKey = useCallback(async (key) => {
    localStorage.setItem('oneseccv_apikey', key)
    setApiKey(key)
    setApiReady(true)
    showToast('success', 'API key activated!')
  }, [showToast])

  // ── Generate CV — same logic as original app.go with retry ──
  const handleGenerate = useCallback(async (userData, instruction = '') => {
    if (!apiReady) { showToast('error', 'API key missing. Configure it in ⚙ Settings'); setActiveTab('api'); return }
    if (!compilerReady) { showToast('error', 'Compilation server unreachable'); return }
    if (!selectedTpl) { showToast('error', 'No template selected'); setActiveTab('templates'); return }

    setIsGenerating(true)
    setResultMsg(null)

    try {
      const tmpl = await getTemplate(selectedTpl)
      const source = await generateCV(apiKey, userData, instruction, tmpl.source, goalJob)

      // ── Compile with retry (same as original: 3 attempts) ──
      const maxAttempts = 3
      let currentSource = source
      let lastError = ''

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const preview = await compilePreview(currentSource)
          setTypstSource(currentSource)
          setPreviewPages(preview.pages)
          setShowPreview(true)
          setResultMsg({ type: 'success', text: '✨ CV generated successfully!' })
          showToast('success', '✨ CV generated successfully!')
          return
        } catch (compileErr) {
          lastError = compileErr.message
          if (attempt < maxAttempts) {
            try {
              currentSource = await fixCompileError(apiKey, currentSource, lastError)
            } catch { break }
          }
        }
      }

      setResultMsg({ type: 'error', text: `❌ Compilation failed after ${maxAttempts} attempts.\n\n${lastError}` })
      showToast('error', 'Compilation failed')
    } catch (e) {
      const msg = String(e?.message || e)
      setResultMsg({ type: 'error', text: `❌ AI Engine error: ${msg}` })
      showToast('error', msg)
    } finally {
      setIsGenerating(false)
    }
  }, [apiKey, apiReady, compilerReady, selectedTpl, goalJob, showToast])

  // ── Refine (quick edit) ──
  const handleRefine = useCallback(async (instruction) => {
    setPreviewLoading(true)
    try {
      const source = await generateCV(apiKey, `CURRENT CV SOURCE:\n${typstSource}`, `MODIFICATION: ${instruction}`, '', '')
      const preview = await compilePreview(source)
      setTypstSource(source)
      setPreviewPages(preview.pages)
      showToast('success', 'Changes applied!')
    } catch (e) {
      showToast('error', String(e?.message || e))
    } finally {
      setPreviewLoading(false)
    }
  }, [apiKey, typstSource, showToast])

  // ── Download ──
  const handleDownload = useCallback(async () => {
    try {
      const blob = await compilePDF(typstSource)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cv_oneseccv.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      showToast('error', String(e?.message || e))
    }
  }, [typstSource, showToast])

  const apiKeyMask = apiKey ? apiKey.slice(0, 6) + '...' + apiKey.slice(-4) : ''

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#050810' }}>
      <StarCanvas />

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: 'rgba(8,12,24,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1A2040' }}>
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center glow-orange"
            style={{ background: 'linear-gradient(135deg, #FF6B1A, #CC4A00)', border: '1px solid rgba(255,107,26,0.5)' }}>
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>OneSecCV</span>
            <span className="ml-2 font-mono text-xs" style={{ color: '#FF6B1A' }}>AI Engine by Christ Bowel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill label="AI Engine" ready={apiReady} />
          <StatusPill label="LaTeX" ready={compilerReady} />
          {showPreview && (
            <button onClick={handleDownload}
              className="font-bold text-xs px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
              style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 16px rgba(255,107,26,0.4)' }}>
              Download CV ↓
            </button>
          )}
        </div>
      </header>

      {/* ── TABS ── */}
      <nav className="flex items-center gap-1 px-6 pt-2 pb-0 shrink-0"
        style={{ background: 'rgba(8,12,24,0.6)', borderBottom: '1px solid #1A2040' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowPreview(false) }}
            className={`tab-btn ${activeTab === tab.id && !showPreview ? 'active' : ''}`}>
            {tab.label}
          </button>
        ))}
        {previewPages.length > 0 && (
          <button onClick={() => setShowPreview(true)}
            className={`tab-btn ${showPreview ? 'active' : ''}`}>
            📄 Preview
          </button>
        )}
      </nav>

      {/* ── CONTENT ── */}
      <main className="flex-1 overflow-hidden relative">
        {showPreview ? (
          <CVPreview
            pages={previewPages}
            onDownload={handleDownload}
            
            loading={previewLoading}
          />
        ) : (
          <>
            <div className={`h-full ${activeTab === 'import'    ? '' : 'hidden'}`}>
              <TabImport onGenerate={handleGenerate} isGenerating={isGenerating} resultMsg={resultMsg} goalJob={goalJob} setGoalJob={setGoalJob} />
            </div>
            <div className={`h-full ${activeTab === 'manual'    ? '' : 'hidden'}`}>
              <TabManual onGenerate={handleGenerate} isGenerating={isGenerating} resultMsg={resultMsg} />
            </div>
            <div className={`h-full ${activeTab === 'templates' ? '' : 'hidden'}`}>
              <TabTemplates templates={templates} selectedTpl={selectedTpl} setSelectedTpl={setSelectedTpl} goalJob={goalJob} setGoalJob={setGoalJob} />
            </div>
            <div className={`h-full ${activeTab === 'api'       ? '' : 'hidden'}`}>
              <TabAPI currentKey={apiKeyMask} onSave={handleSaveKey} showNotification={showToast} />
            </div>
          </>
        )}
        {isGenerating && <LoadingOverlay />}
      </main>

      {toast && <Toast type={toast.type} text={toast.text} onClose={() => setToast(null)} />}

      {/* ── FOOTER ── */}
      <footer className="flex items-center justify-center px-6 py-2 shrink-0"
        style={{ background: 'rgba(8,12,24,0.7)', borderTop: '1px solid #1A2040' }}>
        <span className="font-mono text-xs text-white">
          © 2026 OneSecCV. Designed &amp; Developed by <span style={{ color: '#FF6B1A' }}>Christ Bowel</span>
        </span>
      </footer>
    </div>
  )
}

function StatusPill({ label, ready }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full"
      style={{
        border: `1px solid ${ready ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
        background: ready ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        color: ready ? '#10B981' : '#EF4444',
      }}>
      <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'animate-pulse-slow' : ''}`}
        style={{ background: ready ? '#10B981' : '#EF4444' }} />
      {label}
    </div>
  )
}

function Toast({ type, text, onClose }) {
  const isErr = type === 'error'
  return (
    <div className="fixed bottom-12 right-4 max-w-sm z-50 animate-slide-up flex items-start gap-3 p-4 rounded-xl"
      style={{
        background: isErr ? 'rgba(239,68,68,0.1)' : 'rgba(255,107,26,0.1)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,0.35)' : 'rgba(255,107,26,0.35)'}`,
        color: isErr ? '#EF4444' : '#FF8C42',
      }}>
      <span className="text-base mt-0.5">{isErr ? '✕' : '✓'}</span>
      <p className="flex-1 text-sm leading-snug whitespace-pre-line">{text}</p>
      <button onClick={onClose} className="hover:text-white transition-colors ml-1 text-xs">✕</button>
    </div>
  )
}
