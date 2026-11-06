import { stackedShoe } from '../cards'
import { createGame, type GameState } from '../game'
import { DEFAULT_RULES, type TableRules } from '../rules'

/**
 * One human seat. Deal order for a single seat is:
 *   player card 1, dealer upcard, player card 2, dealer hole card, then draws in order.
 */
export function table(cards: string, rules: Partial<TableRules> = {}, stack = 1000, extraSeats = 0): GameState {
  const seats = [{ name: 'You', human: true, stack }]
  for (let i = 0; i < extraSeats; i++) seats.push({ name: `Seat ${i + 2}`, human: true, stack })
  return createGame({ ...DEFAULT_RULES, ...rules }, seats, 1, stackedShoe(cards))
}
