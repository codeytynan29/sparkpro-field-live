// Basic strategy engine.
//
// Charts are generated per rule set. The 4–8 deck chart follows the widely published
// total-dependent basic strategy (e.g. Wizard of Odds "4 to 8 decks" charts, Griffin,
// Schlesinger) and is cross-checked in strategy.test.ts against this app's own
// expected-value calculator (ev.ts). One- and two-deck charts apply the standard
// published adjustments for those games.
import { cardPoints, upcardValue, type Card } from './cards'
import { handValue, isPair } from './hand'
import { canDoubleTotal, type TableRules } from './rules'

export type Action = 'hit' | 'stand' | 'double' | 'split' | 'surrender'
export const ACTIONS: Action[] = ['hit', 'stand', 'double', 'split', 'surrender']

/**
 * H hit · S stand · D double else hit · Ds double else stand ·
 * P split · Rh surrender else hit · Rs surrender else stand · Rp surrender else split ·
 * '-' (pairs only) do not split, play the total.
 */
export type Code = 'H' | 'S' | 'D' | 'Ds' | 'P' | 'Rh' | 'Rs' | 'Rp' | '-'

export const UPCARDS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
export type Upcard = (typeof UPCARDS)[number]

export type Row = Record<Upcard, Code>
export interface Chart {
  hard: Record<number, Row>   // 4..21
  soft: Record<number, Row>   // 12..21
  pairs: Record<number, Row>  // 2..11 (11 = Aces, 10 = any ten-value pair)
}

function row(spec: string): Row {
  const codes = spec.trim().split(/\s+/) as Code[]
  if (codes.length !== 10) throw new Error('row needs 10 codes: ' + spec)
  const r = {} as Row
  UPCARDS.forEach((u, i) => (r[u] = codes[i]))
  return r
}
const ALL = (c: Code) => row(Array(10).fill(c).join(' '))

function set(r: Row, ups: Upcard[], c: Code) {
  for (const u of ups) r[u] = c
}

export function buildChart(rules: TableRules): Chart {
  const multi = rules.decks >= 4
  const single = rules.decks === 1
  const double = rules.decks === 2
  const h17 = rules.dealerHitsSoft17
  const das = rules.doubleAfterSplit

  const hard: Chart['hard'] = {}
  for (let t = 4; t <= 21; t++) hard[t] = ALL(t >= 17 ? 'S' : 'H')
  hard[8] = single ? row('H H H D D H H H H H') : ALL('H')
  hard[9] = multi ? row('H D D D D H H H H H') : row('D D D D D H H H H H')
  hard[10] = row('D D D D D D D D H H')
  hard[11] = multi && !h17 ? row('D D D D D D D D D H') : ALL('D')
  hard[12] = row('H H S S S H H H H H')
  for (const t of [13, 14, 15, 16]) hard[t] = row('S S S S S H H H H H')

  const soft: Chart['soft'] = {}
  for (let t = 12; t <= 21; t++) soft[t] = ALL(t >= 19 ? 'S' : 'H')
  if (single) {
    soft[13] = row('H H D D D H H H H H')
    soft[14] = row('H H D D D H H H H H')
    soft[17] = row('D D D D D H H H H H')
    soft[18] = row('S Ds Ds Ds Ds S S H H S')
    soft[19] = row('S S S S Ds S S S S S')
    if (h17) soft[18][11] = 'H'
  } else {
    soft[13] = row('H H H D D H H H H H')
    soft[14] = row('H H H D D H H H H H')
    soft[17] = row('H D D D D H H H H H')
    soft[18] = row('S Ds Ds Ds Ds S S H H H')
    if (h17) {
      soft[18][2] = 'Ds'
      soft[19][6] = 'Ds'
    }
  }
  soft[15] = row('H H D D D H H H H H')
  soft[16] = row('H H D D D H H H H H')

  const pairs: Chart['pairs'] = {}
  pairs[2] = das ? row('P P P P P P - - - -') : row('- P P P P P - - - -')
  pairs[3] = das ? row('P P P P P P - - - -') : row('- - P P P P - - - -')
  pairs[4] = das ? row('- - - P P - - - - -') : ALL('-')
  pairs[5] = ALL('-')
  pairs[6] = das ? row('P P P P P - - - - -') : row('- P P P P - - - - -')
  pairs[7] = row('P P P P P P - - - -')
  pairs[8] = ALL('P')
  pairs[9] = row('P P P P P S P P S S')
  pairs[10] = ALL('-')
  pairs[11] = ALL('P')
  if (multi && !das) {
    pairs[2] = row('- - P P P P - - - -')
  }
  if (single || double) {
    if (das) {
      pairs[6] = row('P P P P P P - - - -')
      pairs[7] = row('P P P P P P P - - -')
    } else {
      pairs[6] = row('P P P P P - - - - -')
    }
  }
  if (single) {
    if (das) {
      pairs[3] = row('P P P P P P P - - -')
      pairs[4] = row('- - P P P - - - - -')
    }
    pairs[7][10] = 'S'
  }

  if (rules.lateSurrender) {
    if (multi) {
      set(hard[16], [9, 10, 11], 'Rh')
      set(hard[15], [10], 'Rh')
      if (h17) {
        set(hard[15], [11], 'Rh')
        hard[17][11] = 'Rs'
        pairs[8][11] = 'Rp'
      }
    } else {
      set(hard[16], [10], 'Rh')
      set(hard[15], [10], 'Rh')
      if (double || h17) set(hard[16], [11], 'Rh')
      if (h17) {
        hard[17][11] = 'Rs'
        if (double) set(hard[15], [11], 'Rh')
      }
      if (single) pairs[7][10] = 'Rs'
    }
  }
  return { hard, soft, pairs }
}

const chartCache = new Map<string, Chart>()
export function chartFor(rules: TableRules): Chart {
  const key = [rules.decks, rules.dealerHitsSoft17, rules.doubleAfterSplit, rules.lateSurrender].join('|')
  let c = chartCache.get(key)
  if (!c) {
    c = buildChart(rules)
    chartCache.set(key, c)
  }
  return c
}

export interface DecisionContext {
  canDouble: boolean
  canSplit: boolean
  canSurrender: boolean
}

export type HandKind = 'hard' | 'soft' | 'pair'

export interface Recommendation {
  action: Action
  /** The chart code before fallbacks were applied. */
  code: Code
  kind: HandKind
  /** Chart row key: total for hard/soft, pair value for pairs. */
  rowKey: number
  upcard: Upcard
  /** Stable id of the chart cell, used for weakness tracking: "hard16v10", "pair8v11". */
  cell: string
  /** Set when the chart's first choice wasn't allowed and a fallback was used. */
  fallbackFrom?: Action
}

function resolve(code: Code, ctx: DecisionContext): { action: Action; fallbackFrom?: Action } {
  switch (code) {
    case 'H': return { action: 'hit' }
    case 'S': return { action: 'stand' }
    case 'P': return { action: 'split' }
    case 'D': return ctx.canDouble ? { action: 'double' } : { action: 'hit', fallbackFrom: 'double' }
    case 'Ds': return ctx.canDouble ? { action: 'double' } : { action: 'stand', fallbackFrom: 'double' }
    case 'Rh': return ctx.canSurrender ? { action: 'surrender' } : { action: 'hit', fallbackFrom: 'surrender' }
    case 'Rs': return ctx.canSurrender ? { action: 'surrender' } : { action: 'stand', fallbackFrom: 'surrender' }
    case 'Rp': return ctx.canSurrender ? { action: 'surrender' } : { action: 'split', fallbackFrom: 'surrender' }
    default: return { action: 'stand' }
  }
}

export function recommend(cards: readonly Card[], dealerUp: Card, rules: TableRules, ctx: DecisionContext): Recommendation {
  const chart = chartFor(rules)
  const up = upcardValue(dealerUp) as Upcard
  const v = handValue(cards)
  if (isPair(cards) && ctx.canSplit) {
    const pv = cards[0].rank === 'A' ? 11 : cardPoints(cards[0].rank)
    const code = chart.pairs[pv][up]
    if (code !== '-') {
      const r = resolve(code, ctx)
      return { ...r, code, kind: 'pair', rowKey: pv, upcard: up, cell: `pair${pv}v${up}` }
    }
  }
  if (v.soft && v.total <= 21) {
    const code = chart.soft[v.total][up]
    let r = resolve(code, ctx)
    if (r.action === 'double' && !canDoubleTotal(v.total, true, rules)) r = resolve(code === 'Ds' ? 'S' : 'H', ctx)
    return { ...r, code, kind: 'soft', rowKey: v.total, upcard: up, cell: `soft${v.total}v${up}` }
  }
  const t = Math.max(4, Math.min(21, v.total))
  const code = chart.hard[t][up]
  return { ...resolve(code, ctx), code, kind: 'hard', rowKey: t, upcard: up, cell: `hard${t}v${up}` }
}

export const ACTION_LABEL: Record<Action, string> = {
  hit: 'Hit', stand: 'Stand', double: 'Double down', split: 'Split', surrender: 'Surrender',
}

export const CODE_LABEL: Record<Code, string> = {
  H: 'Hit', S: 'Stand', D: 'Double (else hit)', Ds: 'Double (else stand)', P: 'Split',
  Rh: 'Surrender (else hit)', Rs: 'Surrender (else stand)', Rp: 'Surrender (else split)', '-': 'Don’t split',
}

export function upcardLabel(u: number): string {
  return u === 11 ? 'A' : String(u)
}

/** Parse a cell id back into parts: "soft18v2" → { kind: 'soft', rowKey: 18, upcard: 2 }. */
export function parseCell(cell: string): { kind: HandKind; rowKey: number; upcard: Upcard } | null {
  const m = /^(hard|soft|pair)(\d+)v(\d+)$/.exec(cell)
  if (!m) return null
  return { kind: m[1] as HandKind, rowKey: Number(m[2]), upcard: Number(m[3]) as Upcard }
}

export function cellLabel(cell: string): string {
  const p = parseCell(cell)
  if (!p) return cell
  const hand = p.kind === 'pair' ? `Pair of ${p.rowKey === 11 ? 'Aces' : p.rowKey === 10 ? 'Tens' : p.rowKey + 's'}` : `${p.kind === 'soft' ? 'Soft' : 'Hard'} ${p.rowKey}`
  return `${hand} vs ${upcardLabel(p.upcard)}`
}
