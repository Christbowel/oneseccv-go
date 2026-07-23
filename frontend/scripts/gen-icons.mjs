#!/usr/bin/env node
// Generates the PWA icon set with zero dependencies (raw PNG + zlib).
// Run: npm run icons

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(OUT, { recursive: true })

// ── Tiny PNG encoder ────────────────────────────────────────

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = c ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** @param {Uint8Array} rgba length = w*h*4 */
function encodePNG(rgba, w, h) {
  const stride = w * 4
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Drawing helpers ─────────────────────────────────────────

const mix = (a, b, t) => a + (b - a) * t

/** Signed distance to a rounded rectangle — lets us antialias every edge. */
function sdRoundRect(px, py, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(px - cx) - (halfW - r)
  const qy = Math.abs(py - cy) - (halfH - r)
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0)
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r
}

function blend(buf, i, [r, g, b], alpha) {
  if (alpha <= 0) return
  const a = Math.min(1, alpha)
  buf[i]     = Math.round(mix(buf[i],     r, a))
  buf[i + 1] = Math.round(mix(buf[i + 1], g, a))
  buf[i + 2] = Math.round(mix(buf[i + 2], b, a))
  buf[i + 3] = Math.max(buf[i + 3], Math.round(255 * a))
}

/**
 * The mark: orange gradient tile + a white document with orange text lines.
 * @param {number} size
 * @param {boolean} maskable full-bleed square with a safe zone (Android)
 */
function drawIcon(size, { maskable = false } = {}) {
  const buf = new Uint8Array(size * size * 4)
  const cx = size / 2, cy = size / 2

  // Tile geometry: maskable icons must survive an aggressive circular crop.
  const tileHalf = maskable ? size / 2 : size * 0.47
  const tileRadius = maskable ? 0 : size * 0.22
  const contentScale = maskable ? 0.62 : 0.78

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const px = x + 0.5, py = y + 0.5

      // ── Tile with a diagonal orange gradient ──
      const d = sdRoundRect(px, py, cx, cy, tileHalf, tileHalf, tileRadius)
      const tileA = Math.min(1, Math.max(0, 0.5 - d))
      if (tileA > 0) {
        const t = Math.min(1, Math.max(0, (x + y) / (2 * size)))
        blend(buf, i, [
          Math.round(mix(255, 204, t)),  // #FF6B1A → #CC4A00
          Math.round(mix(107, 74, t)),
          Math.round(mix(26, 0, t)),
        ], tileA)
      }

      // ── Document sheet ──
      const docHalfW = size * 0.20 * contentScale * 1.25
      const docHalfH = size * 0.26 * contentScale * 1.25
      const docD = sdRoundRect(px, py, cx, cy, docHalfW, docHalfH, size * 0.035)
      const docA = Math.min(1, Math.max(0, 0.5 - docD))
      if (docA > 0) blend(buf, i, [255, 255, 255], docA * tileA)

      // ── Three text lines on the sheet ──
      const lineH = size * 0.022
      const gap = size * 0.075
      for (let k = 0; k < 3; k++) {
        const ly = cy - gap + k * gap
        const lw = k === 2 ? docHalfW * 0.42 : docHalfW * 0.62
        const lx = cx - docHalfW * 0.62 + lw
        const lineD = sdRoundRect(px, py, lx, ly, lw, lineH, lineH)
        const lineA = Math.min(1, Math.max(0, 0.5 - lineD))
        if (lineA > 0) blend(buf, i, [255, 107, 26], lineA * docA)
      }
    }
  }
  return encodePNG(buf, size, size)
}

// ── Emit ────────────────────────────────────────────────────

const targets = [
  ['icon-192.png',          192, {}],
  ['icon-512.png',          512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png',  180, {}],
  ['favicon-64.png',         64, {}],
]

for (const [name, size, opts] of targets) {
  writeFileSync(join(OUT, name), drawIcon(size, opts))
  console.log(`✓ ${name} (${size}×${size})`)
}
