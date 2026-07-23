import { useRef, useState } from 'react'
import { extractFile } from '../lib/api'

export default function TabImport({ onGenerate, isGenerating, resultMsg }) {
  const [fileName, setFileName]       = useState('')
  const [extracting, setExtracting]   = useState(false)
  const [extracted, setExtracted]     = useState('')
  const [instruction, setInstruction] = useState('')
  const [extractError, setExtractError] = useState('')
  const [pasteMode, setPasteMode]     = useState(false)
  const fileRef = useRef(null)

  const handleImport = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    setFileName(file.name)
    setExtractError('')
    setExtracted('')
    setExtracting(true)
    try {
      setExtracted(await extractFile(file))
    } catch (err) {
      setExtractError(String(err?.message || err))
    } finally {
      setExtracting(false)
    }
  }

  const reset = () => {
    setFileName(''); setExtracted(''); setInstruction(''); setExtractError(''); setPasteMode(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const canGenerate = extracted.trim().length > 40 && !isGenerating

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pb-8 pt-4 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,.doc"
          onChange={handleImport} className="hidden" />

        {/* Drop zone */}
        <div>
          <p className="label">Your current CV</p>
          <button onClick={() => fileRef.current?.click()} disabled={isGenerating}
            className="w-full rounded-xl p-6 text-center transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
            style={{
              border: fileName ? '2px dashed rgba(255,107,26,0.6)' : '2px dashed #2A3050',
              background: fileName ? 'rgba(255,107,26,0.06)' : 'rgba(8,12,24,0.5)',
            }}>
            {extracting ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: 'rgba(255,107,26,0.3)', borderTopColor: '#FF6B1A' }} />
                <p className="text-sm" style={{ color: '#A0A8C0' }}>Extracting text…</p>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-2xl">📄</span>
                <p className="break-all font-mono text-sm" style={{ color: '#FF8C42' }}>{fileName}</p>
                <p className="text-xs" style={{ color: '#A0A8C0' }}>Tap to choose another file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl opacity-30">⬆</span>
                <p className="text-sm font-semibold text-white">Import your CV</p>
                <p className="text-xs" style={{ color: '#A0A8C0' }}>PDF, DOCX or TXT</p>
              </div>
            )}
          </button>

          <button onClick={() => setPasteMode(v => !v)}
            className="mt-2 w-full text-center text-xs underline" style={{ color: '#7A83A0' }}>
            {pasteMode ? 'Hide the text box' : 'No file handy? Paste your CV text instead'}
          </button>

          {extractError && (
            <p className="mt-2 rounded-lg px-3 py-2 font-mono text-xs"
              style={{ color: '#FCA5A5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {extractError}
            </p>
          )}
        </div>

        {(pasteMode || (extracted && !fileName)) && (
          <div className="animate-fade-in">
            <label className="label">CV text</label>
            <textarea rows={8} value={extracted} onChange={e => setExtracted(e.target.value)}
              disabled={isGenerating}
              placeholder="Paste everything you have: experience, education, skills…"
              className="textarea-field w-full" style={{ minHeight: 170 }} />
          </div>
        )}

        {extracted && !pasteMode && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#10B981' }} />
            <p className="font-mono text-xs" style={{ color: '#10B981' }}>
              {extracted.length.toLocaleString()} characters read
            </p>
            <button onClick={() => setPasteMode(true)} className="text-xs underline" style={{ color: '#7A83A0' }}>
              review / edit
            </button>
          </div>
        )}

        {/* Extra instructions */}
        <div>
          <label className="label">Extra instructions <span style={{ color: '#5A6280' }}>(optional)</span></label>
          <textarea rows={3}
            placeholder="e.g. keep it to one page, emphasise open-source work, write it in French…"
            value={instruction} onChange={e => setInstruction(e.target.value)} disabled={isGenerating}
            className="textarea-field w-full" />
        </div>

        {resultMsg && !isGenerating && <ResultBanner {...resultMsg} />}

        {/* Actions */}
        <div className="flex gap-3 pb-2">
          <button onClick={reset} disabled={isGenerating}
            className="rounded-lg px-4 py-3.5 font-mono text-xs transition-all disabled:opacity-30"
            style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#7A83A0' }}>
            Reset
          </button>
          <button onClick={() => onGenerate(extracted, instruction)} disabled={!canGenerate}
            className="flex-1 rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: '#FF6B1A', color: '#fff', boxShadow: canGenerate ? '0 0 25px rgba(255,107,26,0.4)' : 'none' }}>
            {isGenerating ? 'Generating…' : '✨ Generate my CV'}
          </button>
        </div>

        {!canGenerate && !isGenerating && (
          <p className="pb-2 text-center font-mono text-xs" style={{ color: '#5A6280' }}>
            Import or paste your CV to continue
          </p>
        )}
      </div>
    </div>
  )
}

function ResultBanner({ type, text }) {
  const isErr = type === 'error'
  return (
    <div className="animate-fade-in rounded-xl p-4"
      style={{
        background: isErr ? 'rgba(239,68,68,0.08)' : 'rgba(255,107,26,0.08)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,26,0.3)'}`,
        color: isErr ? '#FCA5A5' : '#FF8C42',
      }}>
      <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{text}</p>
    </div>
  )
}
