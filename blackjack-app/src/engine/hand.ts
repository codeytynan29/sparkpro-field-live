import { cardPoints, type Card } from './cards'

export interface HandValue {
  /** Best total (Aces counted as 11 where that does not bust). */
  total: number
  /** True when an Ace is currently counted as 11. */
  soft: boolean
  bust: boolean
  /** Two-card 21. Whether it pays as a blackjack also depends on split status (see isNatural). */
  blackjack: boolean
}

export function handValue(cards: readonly Card[]): HandValue {
  let hard = 0
  let aces = 0
  for (const c of cards) {
    hard += cardPoints(c.rank)
    if (c.rank === 'A') aces++
  }
  const soft = aces > 0 && hard + 10 <= 21
  const total = soft ? hard + 10 : hard
  return { total, soft, bust: total > 21, blackjack: cards.length === 2 && total === 21 }
}

/** A blackjack only counts as a natural on an unsplit two-card hand. */
export function isNatural(cards: readonly Card[], fromSplit: boolean): boolean {
  return !fromSplit && handValue(cards).blackjack
}

/** Pair by blackjack value: K + 10 is a pair for splitting purposes (as at most casinos). */
export function isPair(cards: readonly Card[]): boolean {
  return cards.length === 2 && cardPoints(cards[0].rank) === cardPoints(cards[1].rank)
}

export function describeHand(cards: readonly Card[]): string {
  const v = handValue(cards)
  if (v.blackjack) return 'Blackjack'
  if (v.bust) return `Bust (${v.total})`
  if (isPair(cards)) {
    const r = cards[0].rank
    const name = r === 'A' ? 'Aces' : cardPoints(r) === 10 ? 'Tens' : `${r}s`
    return `Pair of ${name}`
  }
  return `${v.soft ? 'Soft' : 'Hard'} ${v.total}`
}
