import { useSyncExternalStore } from 'react'

// ── Install-to-home-screen plumbing ─────────────────────────
//
// Chrome/Edge/Android fire `beforeinstallprompt`, which we capture so the app
// can offer a real "Install" button on demand (Settings) instead of only the
// browser's own banner. iOS Safari has no such event, so there we detect the
// platform and show the Share ▸ Add to Home Screen hint.

let deferred = null
const subscribers = new Set()

function notify() {
  subscribers.forEach(fn => { try { fn() } catch { /* noop */ } })
}

/** Call once at startup (before React renders) to catch the early event. */
export function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

function canInstall() {
  return Boolean(deferred)
}

/** Triggers the native install dialog. Returns 'accepted' | 'dismissed' | 'unavailable'. */
export async function promptInstall() {
  if (!deferred) return 'unavailable'
  deferred.prompt()
  const { outcome } = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' }))
  if (outcome === 'accepted') deferred = null
  notify()
  return outcome
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
         // iPadOS 13+ reports as Mac; detect the touch Mac.
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isSafari() {
  const ua = navigator.userAgent
  return /safari/i.test(ua) && !/crios|fxios|android|edg/i.test(ua)
}

/** React hook: live install availability + platform flags. */
export function useInstall() {
  const available = useSyncExternalStore(subscribe, canInstall, () => false)
  return {
    available,           // native prompt ready (Android/Chrome/Edge)
    standalone: isStandalone(),
    ios: isIOS(),
    iosSafari: isIOS() && isSafari(),
    promptInstall,
  }
}
