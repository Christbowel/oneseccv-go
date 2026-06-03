import { GEMINI_MODEL, GEMINI_API_BASE } from '../config'

function geminiFetch(apiKey, body) {
  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

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

  const res = await geminiFetch(apiKey, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini error: ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty AI engine response — model returned no candidates')
  return extractLatex(text)
}

export async function fixCompileError(apiKey, faultyCode, errorLog) {
  const prompt = `The following LaTeX code failed to compile.

ERROR:
${errorLog}

FAULTY CODE:
${faultyCode}

Fix ONLY the compilation error. Keep the same content and structure.
Return ONLY the fixed LaTeX code, no markdown.`

  const res = await geminiFetch(apiKey, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  })

  if (!res.ok) throw new Error('AI fix request failed')
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('AI returned no fix')
  return extractLatex(text)
}

function extractLatex(raw) {
  raw = raw.replace(/```latex/g, '').replace(/```tex/g, '').replace(/```/g, '')
  const match = raw.match(/\\documentclass[\s\S]*\\end\{document\}/)
  if (match) return match[0].trim()
  return raw.trim()
}
