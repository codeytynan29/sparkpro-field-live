export type DeckCount = 1 | 2 | 4 | 6 | 8
export type BlackjackPayout = '3:2' | '6:5'
export type DoubleRestriction = 'any' | '9-11' | '10-11'

export interface TableRules {
  decks: DeckCount
  /** H17 when true, S17 when false. */
  dealerHitsSoft17: boolean
  blackjackPayout: BlackjackPayout
  doubleAfterSplit: boolean
  lateSurrender: boolean
  /** Maximum hands a player can turn one hand into by splitting (2 = no resplit). */
  maxSplitHands: 2 | 3 | 4
  resplitAces: boolean
  /** Most casinos deal exactly one card to each split Ace. */
  hitSplitAces: boolean
  doubleOn: DoubleRestriction
  minBet: number
  maxBet: number
  /** Number of betting spots the player plays at once (1–3). */
  playerHands: 1 | 2 | 3
  /** Fraction of the shoe dealt before reshuffling. */
  penetration: number
}

export const DEFAULT_RULES: TableRules = {
  decks: 6,
  dealerHitsSoft17: false,
  blackjackPayout: '3:2',
  doubleAfterSplit: true,
  lateSurrender: true,
  maxSplitHands: 4,
  resplitAces: false,
  hitSplitAces: false,
  doubleOn: 'any',
  minBet: 10,
  maxBet: 500,
  playerHands: 1,
  penetration: 0.75,
}

export interface RulePreset {
  id: string
  name: string
  blurb: string
  rules: TableRules
}

export const RULE_PRESETS: RulePreset[] = [
  {
    id: 'atlantic-city',
    name: 'Atlantic City Classic',
    blurb: '8 decks, dealer stands on soft 17, double after split, late surrender, 3:2. The rule set the city became known for.',
    rules: { ...DEFAULT_RULES, decks: 8, dealerHitsSoft17: false, lateSurrender: true, maxSplitHands: 3, minBet: 25, maxBet: 1000 },
  },
  {
    id: 'ac-h17',
    name: 'Atlantic City H17',
    blurb: 'Many lower-limit AC tables now hit soft 17. Same otherwise. Costs the player about 0.2%.',
    rules: { ...DEFAULT_RULES, decks: 8, dealerHitsSoft17: true, lateSurrender: true, maxSplitHands: 3, minBet: 15, maxBet: 1000 },
  },
  {
    id: 'online',
    name: 'Online Standard',
    blurb: 'A common digital table: 6 decks, S17, double after split, no surrender, 3:2.',
    rules: { ...DEFAULT_RULES, decks: 6, dealerHitsSoft17: false, lateSurrender: false, maxSplitHands: 2, minBet: 1, maxBet: 500 },
  },
  {
    id: 'six-five',
    name: '6:5 Trap Table',
    blurb: 'Single deck sounds great, but 6:5 blackjacks add roughly 1.4% to the house edge. Learn to spot and skip these.',
    rules: { ...DEFAULT_RULES, decks: 1, dealerHitsSoft17: true, blackjackPayout: '6:5', doubleAfterSplit: false, lateSurrender: false, maxSplitHands: 2, doubleOn: '10-11', minBet: 10, maxBet: 200 },
  },
  {
    id: 'double-deck',
    name: 'Double Deck Pitch',
    blurb: 'Two decks dealt from the hand, cards face down. You touch your cards here: learn the face-down signals.',
    rules: { ...DEFAULT_RULES, decks: 2, dealerHitsSoft17: true, lateSurrender: false, maxSplitHands: 4, minBet: 25, maxBet: 500 },
  },
]

export function blackjackMultiplier(rules: TableRules): number {
  return rules.blackjackPayout === '3:2' ? 1.5 : 1.2
}

export function canDoubleTotal(total: number, soft: boolean, rules: TableRules): boolean {
  if (rules.doubleOn === 'any') return true
  if (soft) return false
  if (rules.doubleOn === '9-11') return total >= 9 && total <= 11
  return total === 10 || total === 11
}

export function describeRules(r: TableRules): string[] {
  return [
    `${r.decks} deck${r.decks > 1 ? 's' : ''}`,
    r.dealerHitsSoft17 ? 'Dealer hits soft 17 (H17)' : 'Dealer stands on soft 17 (S17)',
    `Blackjack pays ${r.blackjackPayout}`,
    r.doubleAfterSplit ? 'Double after split allowed' : 'No double after split',
    r.lateSurrender ? 'Late surrender offered' : 'No surrender',
    r.maxSplitHands > 2 ? `Resplit to ${r.maxSplitHands} hands` : 'No resplitting',
    r.resplitAces ? 'Aces may be resplit' : 'Split Aces cannot be resplit',
    r.hitSplitAces ? 'Split Aces may be hit' : 'One card to each split Ace',
    r.doubleOn === 'any' ? 'Double on any two cards' : `Double on ${r.doubleOn} only`,
    `Bets $${r.minBet}–$${r.maxBet}`,
  ]
}

export function shortRules(r: TableRules): string {
  return `${r.decks}D · ${r.dealerHitsSoft17 ? 'H17' : 'S17'} · ${r.blackjackPayout}${r.doubleAfterSplit ? ' · DAS' : ''}${r.lateSurrender ? ' · LS' : ''}`
}

export function sanitizeRules(r: Partial<TableRules>): TableRules {
  const out = { ...DEFAULT_RULES, ...r }
  if (![1, 2, 4, 6, 8].includes(out.decks)) out.decks = 6
  if (![2, 3, 4].includes(out.maxSplitHands)) out.maxSplitHands = 4
  if (![1, 2, 3].includes(out.playerHands)) out.playerHands = 1
  out.minBet = Math.max(1, Math.round(out.minBet))
  out.maxBet = Math.max(out.minBet, Math.round(out.maxBet))
  out.penetration = Math.min(0.9, Math.max(0.5, out.penetration))
  return out
}
