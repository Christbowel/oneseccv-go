import { COMPILER_URL } from '../config'

// ── Compilation server client ───────────────────────────────
//
// The only server OneSecCV talks to. It is stateless: it takes LaTeX in and
// gives PDFs/PNGs back. No accounts, no storage, no auth.

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body, raw = false, formData, timeout = 120000 } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let res
  try {
    res = await fetch(`${COMPILER_URL}${path}`, {
      method,
      headers,
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') throw new ApiError('The compiler took too long to answer. Try again.', 0)
    throw new ApiError('Cannot reach the compilation server. Check your connection.', 0)
  }
  clearTimeout(timer)

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new ApiError(payload.error || `Request failed (${res.status})`, res.status)
  }
  if (raw) return res.blob()
  if (res.status === 204) return null
  return res.json()
}

export async function health() {
  try { return await request('/api/v1/health', { timeout: 8000 }) } catch { return null }
}

export function listTemplates() {
  return request('/api/v1/templates', { timeout: 15000 })
}

export function getTemplate(slug) {
  return request(`/api/v1/template?slug=${encodeURIComponent(slug)}`, { timeout: 15000 })
}

export function compilePreview(source, ppi = 300) {
  return request('/api/v1/preview', { method: 'POST', body: { source, ppi } })
}

export function compilePDF(source) {
  return request('/api/v1/compile/pdf', { method: 'POST', body: { source }, raw: true })
}

export async function extractFile(file) {
  const form = new FormData()
  form.append('file', file)
  const data = await request('/api/v1/extract', { method: 'POST', formData: form, timeout: 60000 })
  return data.text
}
