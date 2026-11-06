// Exact side-bet math for an N-deck shoe, computed by enumerating card combinations.
// Lessons quote these results instead of typed-in house edges.

export interface PaytableLine { name: string; pays: number; prob: number }
export interface SideBetResult { lines: PaytableLine[]; ev: number; houseEdge: number; hitRate: number }

/** Perfect Pairs on the player's first two cards. Default paytable 25 / 12 / 6. */
export function perfectPairs(decks: number, pays = { perfect: 25, colored: 12, mixed: 6 }): SideBetResult {
  const n = 52 * decks
  const perfect = (decks - 1) / (n - 1)
  const colored = decks / (n - 1)
  const mixed = (2 * decks) / (n - 1)
  const lines = [
    { name: 'Perfect pair (same suit)', pays: pays.perfect, prob: perfect },
    { name: 'Colored pair (same color)', pays: pays.colored, prob: colored },
    { name: 'Mixed pair (different colors)', pays: pays.mixed, prob: mixed },
  ]
  return finish(lines)
}

function finish(lines: PaytableLine[]): SideBetResult {
  const hit = lines.reduce((a, l) => a + l.prob, 0)
  const ev = lines.reduce((a, l) => a + l.pays * l.prob, 0) - (1 - hit)
  return { lines, ev, houseEdge: -ev, hitRate: hit }
}

export type ThreeCardHand = 'suited-trips' | 'straight-flush' | 'trips' | 'straight' | 'flush' | 'nothing'

function classify(r: number[], s: number[]): ThreeCardHand {
  const flush = s[0] === s[1] && s[1] === s[2]
  const trips = r[0] === r[1] && r[1] === r[2]
  if (trips) return flush ? 'suited-trips' : 'trips'
  const sorted = [...r].sort((a, b) => a - b)
  const distinct = sorted[0] !== sorted[1] && sorted[1] !== sorted[2]
  // ranks 0..12 with 0 = Ace; A-2-3 and Q-K-A both count as straights
  const straight = distinct && ((sorted[2] - sorted[0] === 2) || (sorted[0] === 0 && sorted[1] === 11 && sorted[2] === 12))
  if (straight && flush) return 'straight-flush'
  if (straight) return 'straight'
  if (flush) return 'flush'
  return 'nothing'
}

const probCache = new Map<number, Record<ThreeCardHand, number>>()
/** Probabilities of each 3-card poker hand from player's two cards + dealer upcard. */
export function threeCardProbs(decks: number): Record<ThreeCardHand, number> {
  const hit = probCache.get(decks)
  if (hit) return hit
  const n = 52 * decks
  const out: Record<ThreeCardHand, number> = { 'suited-trips': 0, 'straight-flush': 0, trips: 0, straight: 0, flush: 0, nothing: 0 }
  const denom = n * (n - 1) * (n - 2)
  for (let a = 0; a < 52; a++) for (let b = 0; b < 52; b++) for (let c = 0; c < 52; c++) {
    let w = decks
    w *= decks - (b === a ? 1 : 0)
    w *= decks - (c === a ? 1 : 0) - (c === b ? 1 : 0)
    if (w <= 0) continue
    const kind = classify([a % 13, b % 13, c % 13], [Math.floor(a / 13), Math.floor(b / 13), Math.floor(c / 13)])
    out[kind] += w / denom
  }
  probCache.set(decks, out)
  return out
}

export const TWENTY_ONE_PLUS_THREE_TABLES = {
  classic: { name: 'Classic (9 to 1 on any win)', pays: { 'suited-trips': 9, 'straight-flush': 9, trips: 9, straight: 9, flush: 9 } },
  modern: { name: 'Common modern (100 / 40 / 30 / 10 / 5)', pays: { 'suited-trips': 100, 'straight-flush': 40, trips: 30, straight: 10, flush: 5 } },
} as const

export function twentyOnePlusThree(decks: number, table: keyof typeof TWENTY_ONE_PLUS_THREE_TABLES = 'classic'): SideBetResult {
  const p = threeCardProbs(decks)
  const pays = TWENTY_ONE_PLUS_THREE_TABLES[table].pays
  const names: Record<Exclude<ThreeCardHand, 'nothing'>, string> = {
    'suited-trips': 'Suited three of a kind', 'straight-flush': 'Straight flush', trips: 'Three of a kind', straight: 'Straight', flush: 'Flush',
  }
  const lines = (Object.keys(names) as (keyof typeof names)[]).map((k) => ({ name: names[k], pays: pays[k], prob: p[k] }))
  return finish(lines)
}
