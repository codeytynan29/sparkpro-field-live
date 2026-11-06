import type { Card } from './cards'
import { handValue } from './hand'
import type { TableRules } from './rules'

/** Dealer drawing rule: hit below 17; on soft 17 hit only under H17. */
export function dealerShouldHit(cards: readonly Card[], rules: Pick<TableRules, 'dealerHitsSoft17'>): boolean {
  const v = handValue(cards)
  if (v.total < 17) return true
  if (v.total === 17 && v.soft && rules.dealerHitsSoft17) return true
  return false
}

/** Whether the dealer checks the hole card for blackjack (American peek game). */
export function dealerPeeks(upcard: Card): boolean {
  return upcard.rank === 'A' || ['10', 'J', 'Q', 'K'].includes(upcard.rank)
}
