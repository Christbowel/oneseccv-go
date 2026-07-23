import { getAccessToken, NeedsSignIn } from './googleAuth'

// ── CV history in the user's own Google Drive ───────────────
//
// Everything lives in `appDataFolder`: a hidden, per-application folder inside
// the user's Drive. They own the bytes, it costs us nothing, and it needs no
// backend. We keep one small `index.json` (fast listing, one request) plus one
// `cv_<id>.json` per document (source + thumbnail, fetched on demand).

const FILES  = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const FOLDER = 'appDataFolder'
const INDEX_NAME = 'index.json'
const MAX_CVS = 60

export class DriveError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'DriveError'
    this.status = status
  }
}

// ── Low-level request ───────────────────────────────────────

async function driveFetch(url, { method = 'GET', headers = {}, body, raw = false } = {}) {
  const token = await getAccessToken()

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...headers },
    body,
  }).catch(() => { throw new DriveError('Google Drive is unreachable. Check your connection.', 0) })

  if (res.status === 401 || res.status === 403) {
    // 403 here is almost always a missing/te revoked drive.appdata grant.
    throw new NeedsSignIn()
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new DriveError(payload?.error?.message || `Drive request failed (${res.status})`, res.status)
  }
  if (res.status === 204) return null
  return raw ? res.text() : res.json()
}

/** Multipart upload: JSON metadata + JSON content in a single request. */
function multipartBody(metadata, content) {
  const boundary = `oneseccv-${Math.random().toString(36).slice(2)}`
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(content)}\r\n` +
    `--${boundary}--`
  return { body, contentType: `multipart/related; boundary=${boundary}` }
}

async function createFile(name, content) {
  const { body, contentType } = multipartBody(
    { name, parents: [FOLDER], mimeType: 'application/json' },
    content,
  )
  return driveFetch(`${UPLOAD}?uploadType=multipart&fields=id,name`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  })
}

async function updateFile(fileId, content) {
  const { body, contentType } = multipartBody({ mimeType: 'application/json' }, content)
  return driveFetch(`${UPLOAD}/${fileId}?uploadType=multipart&fields=id,name`, {
    method: 'PATCH',
    headers: { 'Content-Type': contentType },
    body,
  })
}

async function readFile(fileId) {
  const text = await driveFetch(`${FILES}/${fileId}?alt=media`, { raw: true })
  try { return JSON.parse(text) } catch { return null }
}

async function findFile(name) {
  const q = encodeURIComponent(`name = '${name.replace(/'/g, "\\'")}'`)
  const res = await driveFetch(
    `${FILES}?spaces=${FOLDER}&q=${q}&fields=files(id,name,modifiedTime)&pageSize=10`)
  return res.files?.[0] || null
}

async function listAll() {
  const res = await driveFetch(
    `${FILES}?spaces=${FOLDER}&fields=files(id,name,modifiedTime)&pageSize=200&orderBy=modifiedTime desc`)
  return res.files || []
}

// ── Index ───────────────────────────────────────────────────

let indexFileId = null

async function loadIndex() {
  if (!indexFileId) {
    const file = await findFile(INDEX_NAME)
    if (!file) return { entries: [], fileId: null }
    indexFileId = file.id
  }
  const data = await readFile(indexFileId)
  return { entries: Array.isArray(data?.entries) ? data.entries : [], fileId: indexFileId }
}

async function saveIndex(entries) {
  const content = { version: 1, updatedAt: new Date().toISOString(), entries }
  if (indexFileId) {
    await updateFile(indexFileId, content)
  } else {
    const created = await createFile(INDEX_NAME, content)
    indexFileId = created.id
  }
  return entries
}

// ── Public API ──────────────────────────────────────────────

/** Metadata of every saved CV, newest first. */
export async function listCVs() {
  const { entries } = await loadIndex()
  return [...entries].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}

/** Full document, including its LaTeX source. */
export async function getCV(id) {
  const { entries } = await loadIndex()
  const entry = entries.find(e => e.id === id)
  if (!entry?.fileId) throw new DriveError('This CV is no longer in your Drive.', 404)
  const data = await readFile(entry.fileId)
  if (!data) throw new DriveError('This CV could not be read.', 500)
  return { ...entry, ...data }
}

/**
 * Creates or updates a CV.
 * @returns the index entry (with its generated id).
 */
export async function saveCV({ id, title, template, targetJob, source, thumbnail }) {
  const { entries } = await loadIndex()
  const now = new Date().toISOString()

  const content = { title, template, targetJob, source, thumbnail, updatedAt: now }
  let entry = id ? entries.find(e => e.id === id) : null

  if (entry) {
    await updateFile(entry.fileId, { ...content, createdAt: entry.createdAt })
    Object.assign(entry, { title, template, targetJob, thumbnail, updatedAt: now })
  } else {
    const newId = `cv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    const created = await createFile(`${newId}.json`, { ...content, createdAt: now })
    entry = {
      id: newId,
      fileId: created.id,
      title,
      template,
      targetJob,
      thumbnail,
      createdAt: now,
      updatedAt: now,
    }
    entries.unshift(entry)
  }

  // Keep the folder tidy — drop the oldest beyond the cap.
  const kept = entries
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, MAX_CVS)
  const dropped = entries.filter(e => !kept.includes(e))
  await saveIndex(kept)
  for (const d of dropped) {
    try { await driveFetch(`${FILES}/${d.fileId}`, { method: 'DELETE' }) } catch { /* best effort */ }
  }

  return entry
}

export async function deleteCV(id) {
  const { entries } = await loadIndex()
  const entry = entries.find(e => e.id === id)
  if (!entry) return
  try {
    await driveFetch(`${FILES}/${entry.fileId}`, { method: 'DELETE' })
  } catch (e) {
    if (e instanceof NeedsSignIn) throw e
    // A file already gone should still leave the index consistent.
  }
  await saveIndex(entries.filter(e => e.id !== id))
}

/**
 * Rebuilds index.json from the actual folder contents. Used when the index is
 * missing or out of sync (e.g. the user cleaned their Drive).
 */
export async function repairIndex() {
  const files = await listAll()
  const entries = []
  for (const f of files) {
    if (f.name === INDEX_NAME) { indexFileId = f.id; continue }
    const data = await readFile(f.id)
    if (!data?.source) continue
    entries.push({
      id: f.name.replace(/\.json$/, ''),
      fileId: f.id,
      title: data.title || 'Untitled CV',
      template: data.template || '',
      targetJob: data.targetJob || '',
      thumbnail: data.thumbnail || '',
      createdAt: data.createdAt || f.modifiedTime,
      updatedAt: data.updatedAt || f.modifiedTime,
    })
  }
  await saveIndex(entries)
  return entries
}

/** Forgets cached ids — call on sign-out so the next account starts clean. */
export function resetDriveCache() {
  indexFileId = null
}
