import { useState, useRef } from 'react'
import { extractFile } from '../api/compiler'

export default function TabImport({ onGenerate, isGenerating, resultMsg, goalJob, setGoalJob }) {
  const [fileName, setFileName]       = useState('')
  const [extracting, setExtracting]   = useState(false)
  const [extracted, setExtracted]     = useState('')
  const [instruction, setInstruction] = useState('')
  const [extractError, setExtractError] = useState('')
  const fileRef = useRef(null)

  const handleImport = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    setFileName(file.name)
    setExtractError('')
    setExtracted('')
    setExtracting(true)
    try {
      const text = await extractFile(file)
      setExtracted(text)
    } catch (err) {
      setExtractError(String(err?.message || err))
    } finally {
      setExtracting(false)
    }
  }

  const handleReset = () => {
    setFileName('')
    setExtracted('')
    setInstruction('')
    setExtractError('')
    setGoalJob('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const canGenerate = extracted && !isGenerating

  return (
    <div className="h-full flex flex-col overflow-hidden p-6 gap-5">
      <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,.doc" onChange={handleImport} className="hidden" />

      {/* Drop zone */}
      <div>
        <p className="label">CV Source</p>
        <button onClick={() => fileRef.current?.click()} disabled={isGenerating}
          className="w-full rounded-xl p-6 text-center transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            border: fileName ? '2px dashed rgba(255,107,26,0.6)' : '2px dashed #2A3050',
            background: fileName ? 'rgba(255,107,26,0.06)' : 'rgba(8,12,24,0.5)',
          }}>
          {extracting ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,107,26,0.3)', borderTopColor: '#FF6B1A' }} />
              <p className="text-sm" style={{ color: '#A0A8C0' }}>Extracting text...</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl">📄</span>
              <p className="text-sm font-mono" style={{ color: '#FF8C42' }}>{fileName}</p>
              <p className="text-xs" style={{ color: '#A0A8C0' }}>Click to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl opacity-30">⬆</span>
              <p className="text-sm font-semibold text-white">Import existing CV</p>
              <p className="text-xs" style={{ color: '#A0A8C0' }}>PDF, DOCX, or TXT</p>
            </div>
          )}
        </button>

        {extractError && (
          <p className="mt-2 text-xs font-mono px-3 py-2 rounded-lg"
            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {extractError}
          </p>
        )}
        {extracted && (
          <div className="mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
            <p className="text-xs font-mono" style={{ color: '#10B981' }}>
              {extracted.length.toLocaleString()} characters extracted
            </p>
          </div>
        )}
      </div>

      {/* Job goal */}
      <div>
        <label className="label">Target Position</label>
        <input type="text" placeholder="e.g. Senior Go Developer, Cybersecurity Engineer..."
          value={goalJob} onChange={e => setGoalJob(e.target.value)} disabled={isGenerating}
          className="input-field" />
      </div>

      {/* AI instructions */}
      <div className="flex-1 flex flex-col min-h-0">
        <label className="label">AI Instructions</label>
        <textarea rows={4}
          placeholder="e.g. Highlight backend skills and open source projects, keep it concise..."
          value={instruction} onChange={e => setInstruction(e.target.value)} disabled={isGenerating}
          className="textarea-field flex-1" />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={handleReset} disabled={isGenerating}
          className="px-4 py-3 rounded-lg text-xs font-mono transition-all duration-200 disabled:opacity-30"
          style={{ background: '#0A0F1E', border: '1px solid #1A2040', color: '#5A6280' }}
          onMouseEnter={e => e.target.style.borderColor = '#FF6B1A'}
          onMouseLeave={e => e.target.style.borderColor = '#1A2040'}>
          Reset
        </button>

        <button onClick={() => onGenerate(extracted, instruction)} disabled={!canGenerate}
          className="flex-1 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#FF6B1A', color: '#fff', boxShadow: canGenerate ? '0 0 25px rgba(255,107,26,0.4)' : 'none' }}>
          {isGenerating ? 'Generating...' : 'GENERATE WITH AI'}
        </button>
      </div>

      {resultMsg && !isGenerating && <ResultBanner type={resultMsg.type} text={resultMsg.text} />}
    </div>
  )
}

function ResultBanner({ type, text }) {
  const isErr = type === 'error'
  return (
    <div className="rounded-xl p-4 animate-fade-in"
      style={{
        background: isErr ? 'rgba(239,68,68,0.08)' : 'rgba(255,107,26,0.08)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,26,0.3)'}`,
        color: isErr ? '#EF4444' : '#FF8C42',
      }}>
      <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  )
}
