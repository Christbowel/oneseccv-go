import { GEMINI_MODEL, GEMINI_API_BASE } from '../config'

// ── Gemini, called straight from the browser ────────────────
// The key is the user's own and never leaves their device: there is no
// OneSecCV backend to send it to.

function geminiFetch(apiKey, body) {
  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * Generates the LaTeX CV.
 * `jobDescription` is the offer text the user pasted — when present it drives
 * the vocabulary and the ordering, which is what ATS keyword matching keys on.
 */
export async function generateCV(apiKey, { userData, instruction, templateSource, targetJob, jobDescription }) {
  const offerBlock = jobDescription?.trim()
    ? `

JOB DESCRIPTION THE CANDIDATE IS APPLYING TO:
"""
${jobDescription.trim().slice(0, 12000)}
"""

HOW TO USE THE JOB DESCRIPTION:
- Reuse its exact terminology for tools, methods and responsibilities whenever the candidate genuinely has that experience — ATS filters match on those literal words.
- Order sections, roles and bullets so that what the offer asks for first appears first.
- Drop or compress experience irrelevant to this offer instead of padding the page.
- Never claim a skill the candidate's data does not support. Missing requirements are simply left out — do not invent them.`
    : ''

  const prompt = `You are the CV expert of OneSecCV.

USER DATA:
${userData}

TARGET POSITION: ${targetJob || '(not specified)'}
ADDITIONAL INSTRUCTIONS: ${instruction || '(none)'}${offerBlock}

LATEX TEMPLATE SOURCE:
${templateSource}

STRICT TECHNICAL RULES:
- Return ONLY the raw LaTeX code, no markdown or explanation.
- Start with \\documentclass and end with \\end{document}.
- Fill ALL sections with the provided user data.
- Escape special LaTeX characters (&, %, $, #, _).
- Use standard dashes (- or --) for date ranges.
- Do not invent any information not present in the user data.
- Rewrite bullets as impact statements: strong action verb, scope, measurable result when the data provides one.`

  return callGeminiWithRetry(apiKey, prompt)
}

export async function fixCompileError(apiKey, faultyCode, errorLog) {
  const prompt = `The following LaTeX code failed to compile.

ERROR:
${String(errorLog).slice(0, 4000)}

FAULTY CODE:
${faultyCode}

Fix ONLY the compilation error. Keep the same content and structure.
Return ONLY the fixed LaTeX code, no markdown.`

  return callGeminiWithRetry(apiKey, prompt)
}

export async function refineCV(apiKey, source, instruction) {
  const prompt = `You are the CV expert of OneSecCV.

CURRENT LATEX CV SOURCE:
${source}

REQUESTED MODIFICATION:
${instruction}

STRICT TECHNICAL RULES:
- Apply the modification and keep everything else identical.
- Return ONLY the raw LaTeX code, no markdown or explanation.
- Start with \\documentclass and end with \\end{document}.
- Escape special LaTeX characters (&, %, $, #, _).
- Do not invent any information that is not already present.`

  return callGeminiWithRetry(apiKey, prompt)
}

// Retry on 429 / RESOURCE_EXHAUSTED, as the desktop app does.
async function callGeminiWithRetry(apiKey, prompt, maxRetries = 3) {
  const waits = [5000, 10000, 15000]

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let res
    try {
      res = await geminiFetch(apiKey, { contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    } catch {
      throw new Error('Cannot reach the AI engine. Check your connection.')
    }

    if (res.status === 429) {
      if (attempt < maxRetries - 1) { await sleep(waits[attempt]); continue }
      throw new Error('Gemini rate limit reached. Wait a minute and try again.')
    }

    if (res.status === 400 || res.status === 403) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || 'Your Gemini API key was rejected. Check it in Settings.')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `AI engine error: ${res.status}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
    if (!text) throw new Error('Empty AI engine response')
    return extractLatexBlock(text)
  }

  throw new Error('Rate limit exceeded after retries')
}

function extractLatexBlock(raw) {
  raw = raw.replace(/```latex/g, '').replace(/```tex/g, '').replace(/```/g, '')
  const match = raw.match(/\\documentclass[\s\S]*?\\end\{document\}/)
  if (match) return match[0].trim()
  return raw.trim()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
