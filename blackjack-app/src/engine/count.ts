// Hi-Lo card counting.
import { cardPoints, type Card } from './cards'
import { handValue } from './hand'
import type { Action } from './strategy'

/** +1 for 2–6, 0 for 7–9, −1 for tens and Aces. */
export function hiLo(card: Card): number {
  if (card.rank === 'A') return -1
  const v = cardPoints(card.rank)
  if (v <= 6) return 1
  if (v >= 10) return -1
  return 0
}

export function runningCount(cards: readonly Card[]): number {
  return cards.reduce((n, c) => n + hiLo(c), 0)
}

/** True count = running count ÷ decks remaining (decks floored at a quarter deck). */
export function trueCount(running: number, decksRemaining: number): number {
  return running / Math.max(0.25, decksRemaining)
}

/** Most counters floor toward zero for betting and index plays; we follow that convention. */
export function trueCountForPlay(running: number, decksRemaining: number): number {
  const tc = trueCount(running, decksRemaining)
  return tc >= 0 ? Math.floor(tc) : Math.ceil(tc)
}

/**
 * Rough Hi-Lo player edge estimate used only for teaching: each +1 true count is
 * worth about +0.5% to the player, starting from the game's off-the-top edge.
 * This is the commonly cited rule of thumb, not a precise per-game value.
 */
export function edgeAtCount(baseEdge: number, tc: number): number {
  return baseEdge + 0.005 * tc
}

/** A conservative 1–8 bet ramp in units: 1 unit at TC ≤ 1, then (TC − 1) × 2, capped. */
export function rampUnits(tc: number, maxUnits = 8): number {
  const t = Math.floor(tc)
  if (t <= 1) return 1
  return Math.min(maxUnits, (t - 1) * 2)
}

export interface IndexPlay {
  id: string
  hand: string
  /** Matches strategy cells: hard16v10 etc. Pairs use pair10v5. */
  cell: string
  basic: Action | 'no-insurance'
  deviation: Action | 'insurance'
  /** Deviate when TC >= index (direction 'at-or-above') or TC <= index ('at-or-below'). */
  index: number
  direction: 'at-or-above' | 'at-or-below'
  note: string
}

/**
 * The "Illustrious 18" Hi-Lo index plays for multi-deck, dealer stands on soft 17,
 * as published by Don Schlesinger (Blackjack Attack). Listed in order of value.
 */
export const ILLUSTRIOUS_18: IndexPlay[] = [
  { id: 'ins', hand: 'Insurance', cell: 'insurance', basic: 'no-insurance', deviation: 'insurance', index: 3, direction: 'at-or-above', note: 'Take insurance at true +3 or higher.' },
  { id: '16v10', hand: '16 vs 10', cell: 'hard16v10', basic: 'hit', deviation: 'stand', index: 0, direction: 'at-or-above', note: 'Stand at any positive count (TC 0 or more).' },
  { id: '15v10', hand: '15 vs 10', cell: 'hard15v10', basic: 'hit', deviation: 'stand', index: 4, direction: 'at-or-above', note: 'Stand at +4 or higher.' },
  { id: '1010v5', hand: '10,10 vs 5', cell: 'pair10v5', basic: 'stand', deviation: 'split', index: 5, direction: 'at-or-above', note: 'Split tens at +5 or higher.' },
  { id: '1010v6', hand: '10,10 vs 6', cell: 'pair10v6', basic: 'stand', deviation: 'split', index: 4, direction: 'at-or-above', note: 'Split tens at +4 or higher.' },
  { id: '10v10', hand: '10 vs 10', cell: 'hard10v10', basic: 'hit', deviation: 'double', index: 4, direction: 'at-or-above', note: 'Double at +4 or higher.' },
  { id: '12v3', hand: '12 vs 3', cell: 'hard12v3', basic: 'hit', deviation: 'stand', index: 2, direction: 'at-or-above', note: 'Stand at +2 or higher.' },
  { id: '12v2', hand: '12 vs 2', cell: 'hard12v2', basic: 'hit', deviation: 'stand', index: 3, direction: 'at-or-above', note: 'Stand at +3 or higher.' },
  { id: '11vA', hand: '11 vs A', cell: 'hard11v11', basic: 'hit', deviation: 'double', index: 1, direction: 'at-or-above', note: 'Double at +1 or higher (S17 shoe).' },
  { id: '9v2', hand: '9 vs 2', cell: 'hard9v2', basic: 'hit', deviation: 'double', index: 1, direction: 'at-or-above', note: 'Double at +1 or higher.' },
  { id: '10vA', hand: '10 vs A', cell: 'hard10v11', basic: 'hit', deviation: 'double', index: 4, direction: 'at-or-above', note: 'Double at +4 or higher.' },
  { id: '9v7', hand: '9 vs 7', cell: 'hard9v7', basic: 'hit', deviation: 'double', index: 3, direction: 'at-or-above', note: 'Double at +3 or higher.' },
  { id: '16v9', hand: '16 vs 9', cell: 'hard16v9', basic: 'hit', deviation: 'stand', index: 5, direction: 'at-or-above', note: 'Stand at +5 or higher.' },
  { id: '13v2', hand: '13 vs 2', cell: 'hard13v2', basic: 'stand', deviation: 'hit', index: -1, direction: 'at-or-below', note: 'Hit at −1 or lower.' },
  { id: '12v4', hand: '12 vs 4', cell: 'hard12v4', basic: 'stand', deviation: 'hit', index: 0, direction: 'at-or-below', note: 'Hit at 0 or lower (any negative count).' },
  { id: '12v5', hand: '12 vs 5', cell: 'hard12v5', basic: 'stand', deviation: 'hit', index: -2, direction: 'at-or-below', note: 'Hit at −2 or lower.' },
  { id: '12v6', hand: '12 vs 6', cell: 'hard12v6', basic: 'stand', deviation: 'hit', index: -1, direction: 'at-or-below', note: 'Hit at −1 or lower.' },
  { id: '13v3', hand: '13 vs 3', cell: 'hard13v3', basic: 'stand', deviation: 'hit', index: -2, direction: 'at-or-below', note: 'Hit at −2 or lower.' },
]

export function indexApplies(play: IndexPlay, tc: number): boolean {
  return play.direction === 'at-or-above' ? tc >= play.index : tc <= play.index
}

/** If a Hi-Lo deviation applies to this hand at this true count, return it. */
export function deviationFor(cards: readonly Card[], dealerUp: Card, tc: number): IndexPlay | null {
  const v = handValue(cards)
  const up = dealerUp.rank === 'A' ? 11 : cardPoints(dealerUp.rank)
  const pairTen = cards.length === 2 && cardPoints(cards[0].rank) === 10 && cardPoints(cards[1].rank) === 10
  const cell = pairTen ? `pair10v${up}` : !v.soft ? `hard${v.total}v${up}` : ''
  const play = ILLUSTRIOUS_18.find((p) => p.cell === cell)
  if (!play) return null
  if (play.id === '16v10' && cards.length !== 2) {
    // The 16 vs 10 index is for multi-card hands too; keep it.
  }
  return indexApplies(play, tc) ? play : null
}
