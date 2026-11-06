// Seeded pseudo-random number generator (mulberry32).
// The game engine never calls Math.random directly: every shuffle is driven by a
// seed, so any hand can be replayed exactly in tests, and live games are seeded
// from the platform's cryptographic random source.

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number
  /** Current internal state, so a shoe can be serialized and resumed. */
  state(): number
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
    state() {
      return a
    },
  }
}

/** A seed from crypto.getRandomValues when available. */
export function randomSeed(): number {
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint32Array(1)
    c.getRandomValues(buf)
    return buf[0]
  }
  return Math.floor(Math.random() * 4294967296)
}

/** Deterministic seed for a string such as a date ("2026-11-05"). */
export function seedFromString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng.next() * n)
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[randInt(rng, items.length)]
}
