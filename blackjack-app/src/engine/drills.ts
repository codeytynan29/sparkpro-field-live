// Practice-situation generator. Builds concrete card hands for strategy-chart cells,
// optionally weighted toward the cells a player gets wrong most.
import { SUITS, type Card, type Rank, type Suit } from './cards'
import { createRng, pick, randInt, type Rng } from './rng'
import type { TableRules } from './rules'
import { chartFor, recommend, UPCARDS, type Action, type DecisionContext, type HandKind, type Recommendation, type Upcard } from './strategy'

export type DrillCategory = 'all' | 'hard' | 'soft' | 'pair' | 'double' | 'surrender'

export const DRILL_CATEGORIES: { id: DrillCategory; label: string; blurb: string }[] = [
  { id: 'all', label: 'Everything', blurb: 'Any hand, any upcard.' },
  { id: 'hard', label: 'Hard totals', blurb: 'No Ace counted as 11, no pairs.' },
  { id: 'soft', label: 'Soft totals', blurb: 'Hands with an Ace counted as 11.' },
  { id: 'pair', label: 'Pairs', blurb: 'Split or not?' },
  { id: 'double', label: 'Doubling', blurb: 'Spots where doubling is on the table.' },
  { id: 'surrender', label: 'Surrender', blurb: 'Late surrender spots and the hands right next to them.' },
]

export interface Situation {
  id: string
  cards: Card[]
  dealerUp: Card
  ctx: DecisionContext
  allowed: Action[]
  rec: Recommendation
}

const TEN_RANKS: Rank[] = ['10', 'J', 'Q', 'K']

function rankFor(v: number, rng: Rng): Rank {
  if (v === 11 || v === 1) return 'A'
  if (v === 10) return pick(rng, TEN_RANKS)
  return String(v) as Rank
}

function card(v: number, rng: Rng, suit?: Suit): Card {
  return { rank: rankFor(v, rng), suit: suit ?? pick(rng, SUITS) }
}

/** Two different (non-pair) cards totalling t, with no Ace. t in 5..19. */
function hardTwo(t: number, rng: Rng): Card[] {
  const options: [number, number][] = []
  for (let a = 2; a <= 10; a++) {
    const b = t - a
    if (b >= 2 && b <= 10 && a < b) options.push([a, b])
  }
  if (!options.length) {
    // 20 = 10+10 (pair); 4 = 2+2 (pair). Fall back to the pair.
    const h = t / 2
    return [card(h, rng), card(h, rng)]
  }
  const [a, b] = pick(rng, options)
  const cards = [card(a, rng), card(b, rng)]
  return rng.next() < 0.5 ? cards : cards.reverse()
}

export interface Cell {
  kind: HandKind
  rowKey: number
  up: Upcard
}

export function cellsFor(category: DrillCategory, rules: TableRules): Cell[] {
  const chart = chartFor(rules)
  const out: Cell[] = []
  const add = (kind: HandKind, rowKey: number, up: Upcard) => out.push({ kind, rowKey, up })
  for (const up of UPCARDS) {
    if (category === 'all' || category === 'hard') for (let t = 5; t <= 19; t++) add('hard', t, up)
    if (category === 'all' || category === 'soft') for (let t = 13; t <= 20; t++) add('soft', t, up)
    if (category === 'all' || category === 'pair') for (let p = 2; p <= 11; p++) add('pair', p, up)
    if (category === 'double') {
      for (let t = 8; t <= 11; t++) add('hard', t, up)
      for (let t = 13; t <= 19; t++) add('soft', t, up)
      add('pair', 5, up)
    }
    if (category === 'surrender') {
      for (const t of [14, 15, 16, 17]) add('hard', t, up)
      add('pair', 8, up)
      add('pair', 7, up)
    }
  }
  if (category === 'surrender') {
    // Keep it focused on strong dealer cards, where surrender happens.
    return out.filter((c) => c.up >= 9)
  }
  if (category === 'double') {
    return out.filter((c) => {
      const code = c.kind === 'hard' ? chart.hard[c.rowKey][c.up] : c.kind === 'soft' ? chart.soft[c.rowKey][c.up] : 'D'
      return code === 'D' || code === 'Ds' || (c.up >= 2 && c.up <= 7)
    })
  }
  return out
}

export function situationFromCell(cell: Cell, rules: TableRules, rng: Rng): Situation {
  let cards: Card[]
  if (cell.kind === 'pair') {
    const s1 = pick(rng, SUITS)
    let s2 = pick(rng, SUITS)
    if (s2 === s1) s2 = SUITS[(SUITS.indexOf(s1) + 1) % 4]
    cards = [card(cell.rowKey, rng, s1), card(cell.rowKey, rng, s2)]
    if (cell.rowKey === 10 && rng.next() < 0.5) cards[1] = { ...cards[1], rank: cards[0].rank }
  } else if (cell.kind === 'soft') {
    const other = cell.rowKey - 11
    cards = [card(11, rng), card(other, rng)]
    if (rng.next() < 0.5) cards.reverse()
  } else {
    cards = hardTwo(cell.rowKey, rng)
  }
  const dealerUp = card(cell.up, rng)
  const ctx: DecisionContext = {
    canDouble: true,
    canSplit: cards[0].rank === cards[1].rank || (cell.kind === 'pair'),
    canSurrender: rules.lateSurrender,
  }
  const allowed: Action[] = ['hit', 'stand', 'double']
  if (ctx.canSplit) allowed.push('split')
  if (ctx.canSurrender) allowed.push('surrender')
  const rec = recommend(cards, dealerUp, rules, ctx)
  return { id: `${rec.cell}-${randInt(rng, 1e9)}`, cards, dealerUp, ctx, allowed, rec }
}

/**
 * Pick the next situation. weights maps cell id → extra weight (e.g. from mistakes).
 * Never repeats the previous cell back to back.
 */
export function nextSituation(category: DrillCategory, rules: TableRules, rng: Rng, weights: Record<string, number> = {}, avoidCell?: string): Situation {
  const cells = cellsFor(category, rules)
  const ids = cells.map((c) => `${c.kind}${c.rowKey}v${c.up}`)
  const w = cells.map((_, i) => (ids[i] === avoidCell ? 0 : 1 + (weights[ids[i]] ?? 0)))
  const total = w.reduce((a, b) => a + b, 0)
  let r = rng.next() * total
  let idx = 0
  for (; idx < w.length - 1; idx++) {
    r -= w[idx]
    if (r <= 0) break
  }
  return situationFromCell(cells[idx], rules, rng)
}

/** Weakness weights: cells missed more often (recently) get much more weight. */
export function weaknessWeights(byCell: Record<string, { total: number; correct: number }>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [cell, s] of Object.entries(byCell)) {
    const wrong = s.total - s.correct
    if (wrong > 0) out[cell] = 40 * (wrong / s.total) + 8 * wrong
  }
  return out
}

/** The ten situations of the day's challenge, identical for everyone on a date. */
export function dailySituations(date: string, rules: TableRules, seed: number): Situation[] {
  const rng = createRng(seed)
  const order: DrillCategory[] = ['hard', 'soft', 'pair', 'hard', 'double', 'soft', 'pair', 'hard', 'double', rules.lateSurrender ? 'surrender' : 'all']
  const out: Situation[] = []
  let last: string | undefined
  for (const cat of order) {
    const s = nextSituation(cat, rules, rng, {}, last)
    last = s.rec.cell
    out.push({ ...s, id: `${date}-${out.length}` })
  }
  return out
}
