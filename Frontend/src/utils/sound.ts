/**
 * Lightweight bell-tone synthesised via Web Audio API.
 *
 * BROWSER AUTOPLAY POLICY
 * -----------------------
 * Browsers block AudioContext.resume() unless called from a direct user gesture.
 * SignalR event handlers are NOT user gestures, so calling resume() there
 * generates console warnings and the sound never plays.
 *
 * Fix: call unlockAudio() on the first user interaction (click/keydown).
 * MainLayout registers a one-time listener that does this automatically.
 * playNotificationChime() then works silently because the context is already
 * in "running" state when the notification arrives.
 */

let cachedCtx: AudioContext | null = null
let audioUnlocked = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!cachedCtx) cachedCtx = new Ctor()
  return cachedCtx
}

/**
 * Call exactly once, from inside a user-gesture handler (click, keydown, touch).
 * MainLayout.tsx does this automatically on first page interaction.
 */
export function unlockAudio(): void {
  if (audioUnlocked || typeof window === 'undefined') return
  const ctx = getCtx()
  if (!ctx) return
  ctx.resume()
    .then(() => { audioUnlocked = true })
    .catch(() => { /* browser may still block — silently ignore */ })
}

export function playNotificationChime(): void {
  const ctx = getCtx()
  if (!ctx) return

  // Context still suspended → user hasn't interacted yet → bail silently.
  // This avoids the "AudioContext was not allowed to start" console warning.
  if (ctx.state === 'suspended') return

  const now    = ctx.currentTime
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(0.18, now + 0.02)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
  master.connect(ctx.destination)

  // Two-tone chime (Instagram / iOS notification feel)
  const tones: { freq: number; start: number; duration: number }[] = [
    { freq: 880,  start: 0,    duration: 0.18 }, // A5
    { freq: 1175, start: 0.13, duration: 0.22 }, // D6
  ]
  tones.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(master)
    osc.start(now + start)
    osc.stop(now + start + duration)
  })
}
