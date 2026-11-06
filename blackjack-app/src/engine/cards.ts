import { createRng, randInt, type Rng } from './rng'

export const SUITS = ['S', 'H', 'D', 'C'] as const
export type Suit = (typeof SUITS)[number]
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
export type Rank = (typeof RANKS)[number]

export interface Card {
  rank: Rank
  suit: Suit
}

export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
export const SUIT_NAME: Record<Suit, string> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' }
export const RANK_NAME: Record<Rank, string> = {
  A: 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven',
  '8': 'Eight', '9': 'Nine', '10': 'Ten', J: 'Jack', Q: 'Queen', K: 'King',
}

/** Blackjack point value; an Ace is reported as 1 here (hand evaluation promotes it to 11). */
export function cardPoints(rank: Rank): number {
  if (rank === 'A') return 1
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10
  return Number(rank)
}

/** Strategy "column" value: 2–10, or 11 for an Ace. */
export function upcardValue(card: Card): number {
  return card.rank === 'A' ? 11 : cardPoints(card.rank)
}

export function isRed(card: Card): boolean {
  return card.suit === 'H' || card.suit === 'D'
}

export function cardLabel(card: Card): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`
}

export function cardName(card: Card): string {
  return `${RANK_NAME[card.rank]} of ${SUIT_NAME[card.suit]}`
}

/** Shorthand parser used heavily in tests: "AS", "10H", "KD", "7c". */
export function parseCard(code: string): Card {
  const m = /^(10|[2-9AJQK])([SHDC])$/i.exec(code.trim())
  if (!m) throw new Error(`Bad card code: ${code}`)
  return { rank: m[1].toUpperCase() as Rank, suit: m[2].toUpperCase() as Suit }
}

export function parseCards(codes: string): Card[] {
  return codes.split(/[\s,]+/).filter(Boolean).map(parseCard)
}

export function freshDeck(): Card[] {
  const out: Card[] = []
  for (const suit of SUITS) for (const rank of RANKS) out.push({ rank, suit })
  return out
}

/** Fisher–Yates shuffle driven by a seeded RNG. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface Shoe {
  decks: number
  cards: Card[]
  /** Index of the next card to deal. */
  pos: number
  /** When pos reaches this index the shoe is reshuffled before the next round. */
  cutAt: number
  /** RNG state after the last shuffle, so reshuffles stay reproducible. */
  rngState: number
  /** Number of shuffles performed so far. */
  shuffles: number
  /** True when the order was supplied by hand (tests, scripted lessons). */
  stacked?: boolean
}

export function buildShoe(decks: number, seed: number, penetration = 0.75): Shoe {
  const rng = createRng(seed)
  let cards: Card[] = []
  for (let d = 0; d < decks; d++) cards = cards.concat(freshDeck())
  cards = shuffle(cards, rng)
  return {
    decks,
    cards,
    pos: 0,
    cutAt: Math.max(15, Math.floor(cards.length * clamp(penetration, 0.4, 0.95))),
    rngState: rng.state(),
    shuffles: 1,
  }
}

/** A shoe whose order is fixed. Once it runs out it falls back to a seeded shoe. */
export function stackedShoe(cards: Card[] | string, decks = 6): Shoe {
  const list = typeof cards === 'string' ? parseCards(cards) : cards
  return { decks, cards: list.slice(), pos: 0, cutAt: Number.MAX_SAFE_INTEGER, rngState: 12345, shuffles: 0, stacked: true }
}

export function needsShuffle(shoe: Shoe): boolean {
  return shoe.pos >= shoe.cutAt
}

export function reshuffle(shoe: Shoe): Shoe {
  const next = buildShoe(shoe.decks, shoe.rngState ^ 0x9e3779b9, shoe.cutAt / Math.max(1, shoe.cards.length))
  return { ...next, shuffles: shoe.shuffles + 1 }
}

/** Deal one card. Returns the card and the advanced shoe (the input is not mutated). */
export function draw(shoe: Shoe): { card: Card; shoe: Shoe } {
  let s = shoe
  if (s.pos >= s.cards.length) {
    // Ran completely dry mid-round (only possible with stacked shoes or extreme splits):
    // start a fresh seeded shoe rather than fail.
    s = { ...buildShoe(Math.max(1, s.decks), s.rngState ^ 0x85ebca6b), shuffles: s.shuffles + 1 }
  }
  return { card: s.cards[s.pos], shoe: { ...s, pos: s.pos + 1 } }
}

export function cardsRemaining(shoe: Shoe): number {
  return shoe.cards.length - shoe.pos
}

export function decksRemaining(shoe: Shoe): number {
  return cardsRemaining(shoe) / 52
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}
