import { GEMINI_MODEL, GEMINI_API_BASE } from '../config'

function geminiFetch(apiKey, body) {
  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Exact same flow as original gemini.go: no generationConfig, retry on 429
export async function generateCV(apiKey, userData, instruction, templateSource, goalJob) {
  const prompt = `You are the CV expert of OneSecCV.

USER DATA:
${userData}

TARGET POSITION: ${goalJob || ''}
ADDITIONAL INSTRUCTIONS: ${instruction || ''}

LATEX TEMPLATE SOURCE:
${templateSource}

STRICT TECHNICAL RULES:
- Return ONLY the raw LaTeX code, no markdown or explanation.
- Start with \\documentclass and end with \\end{document}.
- Fill ALL sections with the provided user data.
- Escape special LaTeX characters (&, %, $, #, _).
- Use standard dashes (- or --) for date ranges.
- Do not invent any information not present in the user data.`

  return callGeminiWithRetry(apiKey, prompt)
}

export async function fixCompileError(apiKey, faultyCode, errorLog) {
  const prompt = `The following LaTeX code failed to compile.

ERROR:
${errorLog}

FAULTY CODE:
${faultyCode}

Fix ONLY the compilation error. Keep the same content and structure.
Return ONLY the fixed LaTeX code, no markdown.`

  return callGeminiWithRetry(apiKey, prompt)
}

// Retry logic: same as original gemini.go (retry on 429/RESOURCE_EXHAUSTED)
async function callGeminiWithRetry(apiKey, prompt, maxRetries = 3) {
  const waits = [5000, 10000, 15000]

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await geminiFetch(apiKey, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    if (res.status === 429) {
      if (attempt < maxRetries - 1) {
        await sleep(waits[attempt])
        continue
      }
      throw new Error('Rate limit exceeded. Please wait a minute and try again.')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `Gemini error: ${res.status}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Empty AI engine response')
    return extractLatexBlock(text)
  }

  throw new Error('Rate limit exceeded after retries')
}

// Exact same extraction as original gemini.go extractLatexBlock
function extractLatexBlock(raw) {
  raw = raw.replace(/```latex/g, '').replace(/```tex/g, '').replace(/```/g, '')
  const match = raw.match(/\\documentclass[\s\S]*?\\end\{document\}/s)
  if (match) return match[0].trim()
  return raw.trim()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
