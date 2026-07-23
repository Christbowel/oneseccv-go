import { useCallback, useEffect, useState } from 'react'
import * as drive from '../lib/drive'
import { NeedsSignIn } from '../lib/googleAuth'
import { useAuth } from '../auth/AuthProvider'
import { EV, track } from '../lib/analytics'

/** CV history, read straight from the user's private Drive folder. */
export default function TabHistory({ onOpen, refreshKey, showToast }) {
  const { sessionLost } = useAuth()
  const [items, setItems]   = useState(null)
  const [error, setError]   = useState('')
  const [busyId, setBusyId] = useState('')

  const handleError = useCallback((e) => {
    if (e instanceof NeedsSignIn) { sessionLost(e.message); return }
    setError(e.message || String(e))
  }, [sessionLost])

  const load = useCallback(() => {
    setError('')
    drive.listCVs()
      .then(setItems)
      .catch(e => { setItems([]); handleError(e) })
  }, [handleError])

  useEffect(load, [load, refreshKey])

  const open = async (id) => {
    setBusyId(id)
    try {
      const cv = await drive.getCV(id)
      track(EV.openHistory, { template: cv.template || 'unknown' })
      await onOpen(cv)
    } catch (e) { handleError(e) } finally { setBusyId('') }
  }

  const remove = async (id) => {
    setBusyId(id)
    try {
      await drive.deleteCV(id)
      setItems(list => list.filter(c => c.id !== id))
      showToast('success', 'CV deleted from your Drive')
    } catch (e) { handleError(e) } finally { setBusyId('') }
  }

  const repair = async () => {
    setItems(null)
    try {
      setItems(await drive.repairIndex())
      showToast('success', 'History rebuilt from your Drive')
    } catch (e) { setItems([]); handleError(e) }
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pb-8 pt-5 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
              My CVs
            </h2>
            <p className="mt-1 text-sm" style={{ color: '#9BA6BC' }}>
              Stored in your private Google Drive folder.
            </p>
          </div>
          <button onClick={load}
            className="shrink-0 rounded-lg px-3 py-2 text-xs transition-colors active:scale-95"
            style={{ background: '#171D2B', border: '1px solid #272E40', color: '#9BA6BC' }}>
            ↻ Refresh
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="font-mono text-xs" style={{ color: '#FCA5A5' }}>{error}</p>
            <button onClick={repair} className="mt-2 text-xs underline" style={{ color: '#FF8C42' }}>
              Rebuild the history from Drive
            </button>
          </div>
        )}

        {items === null && (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: '#171D2B' }} />)}
          </div>
        )}

        {items?.length === 0 && !error && (
          <div className="rounded-2xl px-6 py-12 text-center"
            style={{ background: 'rgba(8,12,24,0.6)', border: '1px dashed #2A3145' }}>
            <div className="mb-3 text-3xl opacity-40">🗂</div>
            <p className="text-sm font-semibold text-white">No CV saved yet</p>
            <p className="mx-auto mt-1 max-w-xs text-sm" style={{ color: '#9BA6BC' }}>
              Generate one and it lands here automatically - on every device you sign in from.
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {items?.map(cv => (
            <li key={cv.id}
              className="flex items-center gap-3 rounded-xl p-3 sm:gap-4 sm:p-4"
              style={{ background: 'rgba(8,12,24,0.75)', border: '1px solid #272E40' }}>

              <div className="h-16 w-12 shrink-0 overflow-hidden rounded"
                style={{ background: '#171D2B', border: '1px solid #222838' }}>
                {cv.thumbnail
                  ? <img src={`data:image/png;base64,${cv.thumbnail}`} alt="" className="h-full w-full object-cover object-top" />
                  : <div className="flex h-full items-center justify-center text-lg opacity-30">📄</div>}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{cv.title}</p>
                  {cv.hasLetter && (
                    <span className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] tracking-wide"
                      style={{ color: '#5B8FFF', background: 'rgba(30,111,255,0.12)', border: '1px solid rgba(30,111,255,0.3)' }}>
                      ✉ LETTER
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px]" style={{ color: '#828BA0' }}>
                  {cv.template || 'template'} · {formatDate(cv.updatedAt)}
                </p>
                {cv.targetJob && (
                  <p className="mt-1 truncate text-xs" style={{ color: '#9BA6BC' }}>🎯 {cv.targetJob}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:gap-2">
                <button onClick={() => open(cv.id)} disabled={busyId === cv.id}
                  className="rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: '#FF6B1A', color: '#fff' }}>
                  {busyId === cv.id ? '…' : 'Open'}
                </button>
                <button onClick={() => remove(cv.id)} disabled={busyId === cv.id}
                  aria-label={`Delete ${cv.title}`}
                  className="rounded-lg px-3 py-2 text-xs transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: '#171D2B', border: '1px solid #272E40', color: '#828BA0' }}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString()
}
