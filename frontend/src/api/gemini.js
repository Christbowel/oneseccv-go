import { GEMINI_MODEL, GEMINI_API_BASE } from '../config'
import { COVER_LETTER_TEMPLATE } from '../lib/coverLetterTemplate'

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

/**
 * Generates a cover letter tailored to the SAME job offer the CV targets.
 * It reads the candidate's real details out of the already-generated CV, so the
 * contact block and the claims stay consistent between the two documents.
 */
export async function generateCoverLetter(apiKey, { cvSource, jobDescription, targetJob, instruction, language }) {
  const offerBlock = jobDescription?.trim()
    ? `

JOB DESCRIPTION THE CANDIDATE IS APPLYING TO:
"""
${jobDescription.trim().slice(0, 12000)}
"""`
    : ''

  const langLine = language?.trim()
    ? `\n- Write the letter in this language: ${language.trim()}.`
    : '\n- Write the letter in the same language as the CV.'

  const prompt = `You are the career-writing expert of OneSecCV. Write a compelling, specific cover letter.

THE CANDIDATE'S CV (LaTeX — extract their real name, contact details and experience from it):
${cvSource}

TARGET POSITION: ${targetJob || '(infer it from the job description)'}
ADDITIONAL INSTRUCTIONS: ${instruction || '(none)'}${offerBlock}

LATEX TEMPLATE TO FILL:
${COVER_LETTER_TEMPLATE}

STRICT RULES:
- Return ONLY the raw LaTeX code, no markdown or explanation.
- Start with \\documentclass and end with \\end{document}.
- Fill the sender block with the candidate's REAL name, email, phone and city taken from the CV. If a detail is genuinely absent, remove that item rather than inventing it.
- Extract the company name and the exact job title from the job description. If the company is not stated, write "the hiring team" and drop the company line.
- Three to four short paragraphs: why this role/company, then a concrete match between the candidate's real experience and the offer's key requirements (echo the offer's own terminology), then a confident closing with a call to action.
- Never invent experience, employers, numbers or skills the CV does not support.
- Escape special LaTeX characters (&, %, $, #, _). Keep it to a single page.${langLine}`

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

  if (!apiKey) {
    throw new Error('No AI key yet. Open Settings and paste your free Google AI key to start.')
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let res
    try {
      res = await geminiFetch(apiKey, { contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    } catch {
      throw new Error('Could not reach the AI. Check your internet connection and try again.')
    }

    // Too many requests for the free tier: back off, then give a calm message.
    if (res.status === 429) {
      if (attempt < maxRetries - 1) { await sleep(waits[attempt]); continue }
      throw new Error('The AI is busy (free-tier limit reached). Wait about a minute, then try again.')
    }

    // A bad or unauthorised key. Always point the user to the one fix they can act on.
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new Error(await keyProblemMessage(res))
    }

    // Google's side is down or overloaded — nothing the user did wrong.
    if (res.status === 500 || res.status === 503) {
      if (attempt < maxRetries - 1) { await sleep(waits[attempt]); continue }
      throw new Error('The AI service is temporarily unavailable. Please try again in a moment.')
    }

    if (!res.ok) {
      throw new Error('The AI could not complete this request right now. Please try again.')
    }

    const data = await res.json().catch(() => null)
    if (!data) throw new Error('The AI sent back something unreadable. Please try again.')

    // The model can refuse content for safety reasons instead of erroring.
    const blocked = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
    if (!text) {
      if (blocked && blocked !== 'STOP') {
        throw new Error('The AI declined to answer this one. Rephrase your details or instructions and try again.')
      }
      throw new Error('The AI returned an empty answer. Please try again.')
    }
    return extractLatexBlock(text)
  }

  throw new Error('The AI is busy right now. Wait a minute, then try again.')
}

/**
 * Turns a 400/401/403 from Gemini into a message a non-technical user can act
 * on. Almost every cause here comes back to the API key, so we always steer
 * them to Settings rather than showing Google's raw wording.
 */
async function keyProblemMessage(res) {
  const err = await res.json().catch(() => ({}))
  const reason = err?.error?.status || ''
  const raw = String(err?.error?.message || '').toLowerCase()

  if (raw.includes('api key not valid') || raw.includes('api_key_invalid') || reason === 'INVALID_ARGUMENT') {
    return 'Your AI key was not accepted. Open Settings and paste a fresh key from Google AI Studio (it is free and takes a minute).'
  }
  if (reason === 'PERMISSION_DENIED' || res.status === 403) {
    return 'Your AI key was refused. Make sure you copied the whole key from Google AI Studio, then paste it again in Settings.'
  }
  return 'There is a problem with your AI key. Open Settings and paste a new free key from Google AI Studio.'
}

function extractLatexBlock(raw) {
  raw = raw.replace(/```latex/g, '').replace(/```tex/g, '').replace(/```/g, '')
  const match = raw.match(/\\documentclass[\s\S]*?\\end\{document\}/)
  if (match) return match[0].trim()
  return raw.trim()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
