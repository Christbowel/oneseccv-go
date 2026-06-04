import { COMPILER_URL } from '../config'

export async function compilePreview(source, ppi = 450) {
  const res = await fetch(`${COMPILER_URL}/api/v1/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, ppi }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Compilation failed')
  }
  return res.json()
}

export async function compilePDF(source) {
  const res = await fetch(`${COMPILER_URL}/api/v1/compile/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'PDF compilation failed')
  }
  const blob = await res.blob()
  return blob
}

export async function extractFile(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${COMPILER_URL}/api/v1/extract`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Extraction failed')
  }
  const data = await res.json()
  return data.text
}

export async function listTemplates() {
  const res = await fetch(`${COMPILER_URL}/api/v1/templates`)
  if (!res.ok) throw new Error('Failed to fetch templates')
  return res.json()
}

export async function getTemplate(slug) {
  const res = await fetch(`${COMPILER_URL}/api/v1/template?slug=${slug}`)
  if (!res.ok) throw new Error(`Template "${slug}" not found`)
  return res.json()
}

export async function healthCheck() {
  try {
    const res = await fetch(`${COMPILER_URL}/api/v1/health`)
    return res.ok
  } catch { return false }
}
