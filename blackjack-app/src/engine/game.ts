// Blackjack round engine. Pure functions over plain, serializable state: every
// function takes a state and returns a new one. The UI never decides outcomes;
// it only calls these functions and renders what they return.
import { buildShoe, draw, needsShuffle, reshuffle, type Card, type Shoe } from './cards'
import { dealerPeeks, dealerShouldHit } from './dealer'
import { handValue, isNatural, isPair } from './hand'
import { blackjackMultiplier, canDoubleTotal, sanitizeRules, type TableRules } from './rules'
import { recommend, type Action, type Recommendation } from './strategy'

export type Phase = 'betting' | 'insurance' | 'playing' | 'dealer' | 'settled'

export type Outcome =
  | 'blackjack' | 'win' | 'lose' | 'push' | 'bust' | 'surrender'
  | 'dealer-blackjack' | 'even-money'

export interface PlayerHand {
  id: string
  cards: Card[]
  bet: number
  doubled: boolean
  fromSplit: boolean
  splitAces: boolean
  surrendered: boolean
  done: boolean
  outcome?: Outcome
  /** Net chips for this hand after settlement (excludes insurance). */
  net?: number
  /** Number of actions taken (used to know when surrender is still possible). */
  actions: number
}

export type NpcStyle = 'basic' | 'cautious' | 'gambler'

export interface Seat {
  id: number
  name: string
  human: boolean
  style: NpcStyle
  stack: number
  bet: number
  hands: PlayerHand[]
  activeHand: number
  insurance: number
  insuranceDecided: boolean
  tookEvenMoney: boolean
  insuranceNet?: number
  sittingOut: boolean
  /** Seat whose stack this seat bets from (for one player playing several spots). */
  wallet: number
}

export interface Decision {
  round: number
  seatId: number
  handId: string
  kind: 'play' | 'insurance'
  cards: Card[]
  dealerUp: Card
  action: Action | 'insurance' | 'no-insurance' | 'even-money' | 'no-even-money'
  /** Basic strategy recommendation; for insurance decisions, always to decline. */
  recommended: Action | 'no-insurance' | 'no-even-money' | 'even-money'
  rec?: Recommendation
  correct: boolean
  allowed: Action[]
}

export type GameEvent =
  | { t: 'shuffle' }
  | { t: 'deal'; to: 'dealer' | number; hand?: string; card: Card; faceDown?: boolean }
  | { t: 'insurance-offered' }
  | { t: 'peek'; blackjack: boolean }
  | { t: 'action'; seatId: number; hand: string; action: Action }
  | { t: 'insurance'; seatId: number; take: boolean; evenMoney: boolean }
  | { t: 'reveal'; card: Card }
  | { t: 'dealer-draw'; card: Card }
  | { t: 'dealer-done'; total: number; bust: boolean }
  | { t: 'settle' }

export interface GameState {
  rules: TableRules
  shoe: Shoe
  phase: Phase
  seats: Seat[]
  dealer: Card[]
  holeRevealed: boolean
  activeSeat: number
  dealerBlackjack: boolean
  round: number
  events: GameEvent[]
  decisions: Decision[]
  /** Shoe position at the last shuffle, for card counting. */
  shuffleMark: number
  /** Shoe index of the dealer's hole card this round. */
  holePos: number
  nextHandId: number
}

export interface SeatConfig {
  name: string
  human: boolean
  style?: NpcStyle
  stack: number
  /** Index of the seat whose chips this seat uses; defaults to itself. */
  wallet?: number
}

export function createGame(rules: Partial<TableRules>, seats: SeatConfig[], seed: number, shoe?: Shoe): GameState {
  const r = sanitizeRules(rules)
  return {
    rules: r,
    shoe: shoe ?? buildShoe(r.decks, seed, r.penetration),
    phase: 'betting',
    seats: seats.map((s, i) => ({
      id: i, name: s.name, human: s.human, style: s.style ?? 'basic', stack: s.stack, bet: 0,
      hands: [], activeHand: 0, insurance: 0, insuranceDecided: false, tookEvenMoney: false, sittingOut: false,
      wallet: s.wallet ?? i,
    })),
    dealer: [],
    holeRevealed: false,
    activeSeat: -1,
    dealerBlackjack: false,
    round: 0,
    events: [],
    decisions: [],
    shuffleMark: 0,
    holePos: -1,
    nextHandId: 1,
  }
}

export class GameError extends Error {}

/** The seat that actually holds the chips for a seat. */
export function walletOf(s: GameState, seat: Seat): Seat {
  return s.seats[seat.wallet] ?? seat
}

function clone(s: GameState): GameState {
  return structuredClone(s)
}

function take(s: GameState): Card {
  const { card, shoe } = draw(s.shoe)
  if (shoe.shuffles !== s.shoe.shuffles) s.shuffleMark = 0
  s.shoe = shoe
  return card
}

function newHand(s: GameState, bet: number, cards: Card[] = [], extra: Partial<PlayerHand> = {}): PlayerHand {
  return { id: `h${s.nextHandId++}`, cards, bet, doubled: false, fromSplit: false, splitAces: false, surrendered: false, done: false, actions: 0, ...extra }
}

export function validateBet(rules: TableRules, stack: number, bet: number): string | null {
  if (!Number.isFinite(bet) || bet <= 0) return 'Place a bet to play.'
  if (bet < rules.minBet) return `Table minimum is $${rules.minBet}.`
  if (bet > rules.maxBet) return `Table maximum is $${rules.maxBet}.`
  if (bet > stack) return 'Not enough chips for that bet.'
  return null
}

/**
 * Start a round. bets maps seat id → wager; seats with no bet (or 0) sit out.
 * Deals American style: one card to each spot left to right, dealer upcard,
 * second card to each spot, dealer hole card.
 */
export function startRound(state: GameState, bets: Record<number, number>): GameState {
  if (state.phase !== 'betting' && state.phase !== 'settled') throw new GameError('A round is already in progress.')
  const s = clone(state)
  s.events = []
  s.decisions = []
  s.round += 1
  if (needsShuffle(s.shoe)) {
    s.shoe = reshuffle(s.shoe)
    s.shuffleMark = 0
    s.events.push({ t: 'shuffle' })
  }
  let anyone = false
  for (const seat of s.seats) {
    const bet = bets[seat.id] ?? 0
    seat.hands = []
    seat.activeHand = 0
    seat.insurance = 0
    seat.insuranceDecided = false
    seat.tookEvenMoney = false
    seat.insuranceNet = undefined
    seat.bet = 0
    seat.sittingOut = !(bet > 0)
    if (seat.sittingOut) continue
    const w = walletOf(s, seat)
    const err = validateBet(s.rules, w.stack, bet)
    if (err) throw new GameError(`${seat.name}: ${err}`)
    w.stack -= bet
    seat.bet = bet
    seat.hands = [newHand(s, bet)]
    anyone = true
  }
  if (!anyone) throw new GameError('Place a bet to play.')
  s.dealer = []
  s.holeRevealed = false
  s.dealerBlackjack = false
  for (let pass = 0; pass < 2; pass++) {
    for (const seat of s.seats) {
      if (seat.sittingOut) continue
      const card = take(s)
      seat.hands[0].cards.push(card)
      s.events.push({ t: 'deal', to: seat.id, hand: seat.hands[0].id, card })
    }
    const card = take(s)
    s.dealer.push(card)
    if (pass === 1) s.holePos = s.shoe.pos - 1
    s.events.push({ t: 'deal', to: 'dealer', card, faceDown: pass === 1 })
  }
  for (const seat of s.seats) {
    if (seat.sittingOut) continue
    if (isNatural(seat.hands[0].cards, false)) seat.hands[0].done = true
  }
  if (s.dealer[0].rank === 'A') {
    s.phase = 'insurance'
    s.events.push({ t: 'insurance-offered' })
    for (const seat of s.seats) if (!seat.sittingOut && !seat.human) autoInsurance(s, seat)
    return maybeFinishInsurance(s)
  }
  return afterPeek(s)
}

function autoInsurance(s: GameState, seat: Seat) {
  // NPC personalities: the "gambler" takes insurance (a teaching moment), others decline.
  const takeIt = seat.style === 'gambler' && walletOf(s, seat).stack >= seat.bet / 2
  applyInsurance(s, seat, takeIt)
}

function applyInsurance(s: GameState, seat: Seat, takeIt: boolean) {
  const hand = seat.hands[0]
  const natural = isNatural(hand.cards, false)
  if (natural) {
    if (takeIt) {
      // Even money: paid 1:1 immediately, hand is over.
      seat.tookEvenMoney = true
      hand.done = true
      hand.outcome = 'even-money'
      hand.net = hand.bet
      walletOf(s, seat).stack += hand.bet * 2
    }
  } else if (takeIt) {
    const amount = hand.bet / 2
    const w = walletOf(s, seat)
    if (amount > w.stack) throw new GameError('Not enough chips for insurance.')
    seat.insurance = amount
    w.stack -= amount
  }
  seat.insuranceDecided = true
  s.events.push({ t: 'insurance', seatId: seat.id, take: takeIt, evenMoney: natural })
}

export function insuranceDecision(state: GameState, seatId: number, takeIt: boolean): GameState {
  if (state.phase !== 'insurance') throw new GameError('Insurance is not being offered.')
  const s = clone(state)
  s.events = []
  const seat = s.seats[seatId]
  if (!seat || seat.sittingOut) throw new GameError('No such seat.')
  if (seat.insuranceDecided) throw new GameError('Insurance already decided for this seat.')
  const natural = isNatural(seat.hands[0].cards, false)
  if (seat.human) {
    s.decisions.push({
      round: s.round, seatId, handId: seat.hands[0].id, kind: 'insurance', cards: seat.hands[0].cards.slice(), dealerUp: s.dealer[0],
      action: natural ? (takeIt ? 'even-money' : 'no-even-money') : takeIt ? 'insurance' : 'no-insurance',
      recommended: natural ? (evenMoneyIsCorrect(s.rules) ? 'even-money' : 'no-even-money') : 'no-insurance',
      correct: natural && evenMoneyIsCorrect(s.rules) ? takeIt : !takeIt, allowed: [],
    })
  }
  applyInsurance(s, seat, takeIt)
  return maybeFinishInsurance(s)
}

/**
 * Even money pays exactly 1 unit. Declining pays the blackjack rate unless the dealer
 * has blackjack (4/13 of the time with an Ace up, infinite deck), so declining is worth
 * (9/13) × payout: 1.04 at 3:2 (decline) but only 0.83 at 6:5 (take even money).
 */
export function evenMoneyIsCorrect(rules: TableRules): boolean {
  return (9 / 13) * blackjackMultiplier(rules) < 1
}

function maybeFinishInsurance(s: GameState): GameState {
  if (s.seats.some((x) => !x.sittingOut && !x.insuranceDecided)) return s
  return afterPeek(s)
}

function afterPeek(s: GameState): GameState {
  const up = s.dealer[0]
  if (dealerPeeks(up)) {
    const bj = handValue(s.dealer).blackjack
    s.events.push({ t: 'peek', blackjack: bj })
    if (bj) {
      s.dealerBlackjack = true
      s.holeRevealed = true
      s.events.push({ t: 'reveal', card: s.dealer[1] })
      return settle(s)
    }
  }
  // Insurance lost (dealer has no blackjack): already deducted, settled as a loss later.
  s.phase = 'playing'
  s.activeSeat = -1
  return advance(s)
}

function activeHandOf(s: GameState): { seat: Seat; hand: PlayerHand } | null {
  if (s.phase !== 'playing' || s.activeSeat < 0) return null
  const seat = s.seats[s.activeSeat]
  const hand = seat?.hands[seat.activeHand]
  return hand ? { seat, hand } : null
}

/** Move play to the next unfinished hand, dealing second cards to split hands as they come up. */
function advance(s: GameState): GameState {
  let seatIdx = s.activeSeat < 0 ? 0 : s.activeSeat
  while (seatIdx < s.seats.length) {
    const seat = s.seats[seatIdx]
    if (!seat.sittingOut) {
      for (let h = seatIdx === s.activeSeat ? seat.activeHand : 0; h < seat.hands.length; h++) {
        const hand = seat.hands[h]
        if (hand.cards.length === 1) {
          const card = take(s)
          hand.cards.push(card)
          s.events.push({ t: 'deal', to: seat.id, hand: hand.id, card })
          autoComplete(s, seat, hand)
        }
        if (!hand.done) {
          s.activeSeat = seatIdx
          seat.activeHand = h
          if (!seat.human) return npcPlay(s)
          return s
        }
      }
    }
    seatIdx++
    if (seatIdx < s.seats.length) s.seats[seatIdx].activeHand = 0
    s.activeSeat = seatIdx
  }
  s.activeSeat = -1
  return dealerPlay(s)
}

function autoComplete(s: GameState, seat: Seat, hand: PlayerHand) {
  const v = handValue(hand.cards)
  if (v.total >= 21) {
    hand.done = true
    return
  }
  if (hand.splitAces && !s.rules.hitSplitAces) {
    const canResplit = isPair(hand.cards) && hand.cards[0].rank === 'A' && s.rules.resplitAces && seat.hands.length < s.rules.maxSplitHands
    if (!canResplit) hand.done = true
  }
}

export function availableActions(state: GameState): Action[] {
  const cur = activeHandOf(state)
  if (!cur) return []
  return actionsFor(state, cur.seat, cur.hand)
}

function actionsFor(s: GameState, seat: Seat, hand: PlayerHand): Action[] {
  const r = s.rules
  const v = handValue(hand.cards)
  if (hand.done || v.total >= 21) return []
  const out: Action[] = []
  const lockedAces = hand.splitAces && !r.hitSplitAces
  if (!lockedAces) out.push('hit')
  out.push('stand')
  const two = hand.cards.length === 2
  if (two && !lockedAces && hand.actions === 0 && (!hand.fromSplit || r.doubleAfterSplit) && canDoubleTotal(v.total, v.soft, r) && walletOf(s, seat).stack >= hand.bet) out.push('double')
  if (two && hand.actions === 0 && isPair(hand.cards) && seat.hands.length < r.maxSplitHands && walletOf(s, seat).stack >= hand.bet) {
    const aces = hand.cards[0].rank === 'A'
    if (!aces || !hand.fromSplit || r.resplitAces) out.push('split')
  }
  if (two && r.lateSurrender && hand.actions === 0 && !hand.fromSplit && seat.hands.length === 1) out.push('surrender')
  return out
}

/** The basic-strategy recommendation for the hand currently being played. */
export function currentRecommendation(state: GameState): Recommendation | null {
  const cur = activeHandOf(state)
  if (!cur) return null
  return recommendFor(state, cur.seat, cur.hand)
}

function recommendFor(s: GameState, seat: Seat, hand: PlayerHand): Recommendation {
  const allowed = actionsFor(s, seat, hand)
  return recommend(hand.cards, s.dealer[0], s.rules, {
    canDouble: allowed.includes('double'),
    canSplit: allowed.includes('split'),
    canSurrender: allowed.includes('surrender'),
  })
}

export function act(state: GameState, action: Action): GameState {
  const cur0 = activeHandOf(state)
  if (!cur0) throw new GameError('No hand to play right now.')
  const allowed = actionsFor(state, cur0.seat, cur0.hand)
  if (!allowed.includes(action)) throw new GameError(`You can't ${action} this hand.`)
  const s = clone(state)
  s.events = []
  const { seat, hand } = activeHandOf(s)!
  if (seat.human) {
    const rec = recommendFor(s, seat, hand)
    s.decisions.push({
      round: s.round, seatId: seat.id, handId: hand.id, kind: 'play', cards: hand.cards.slice(), dealerUp: s.dealer[0],
      action, recommended: rec.action, rec, correct: rec.action === action, allowed,
    })
  }
  applyAction(s, seat, hand, action)
  return advance(s)
}

function applyAction(s: GameState, seat: Seat, hand: PlayerHand, action: Action) {
  s.events.push({ t: 'action', seatId: seat.id, hand: hand.id, action })
  hand.actions++
  switch (action) {
    case 'hit': {
      const card = take(s)
      hand.cards.push(card)
      s.events.push({ t: 'deal', to: seat.id, hand: hand.id, card })
      if (handValue(hand.cards).total >= 21) hand.done = true
      break
    }
    case 'stand':
      hand.done = true
      break
    case 'double': {
      walletOf(s, seat).stack -= hand.bet
      hand.bet *= 2
      hand.doubled = true
      const card = take(s)
      hand.cards.push(card)
      s.events.push({ t: 'deal', to: seat.id, hand: hand.id, card })
      hand.done = true
      break
    }
    case 'split': {
      const aces = hand.cards[0].rank === 'A'
      walletOf(s, seat).stack -= hand.bet
      const second = newHand(s, hand.bet, [hand.cards[1]], { fromSplit: true, splitAces: aces })
      hand.cards = [hand.cards[0]]
      hand.fromSplit = true
      hand.splitAces = aces
      hand.actions = 0
      const idx = seat.hands.indexOf(hand)
      seat.hands.splice(idx + 1, 0, second)
      // The first hand gets its second card now; the other waits its turn (advance deals it).
      const card = take(s)
      hand.cards.push(card)
      s.events.push({ t: 'deal', to: seat.id, hand: hand.id, card })
      autoComplete(s, seat, hand)
      break
    }
    case 'surrender':
      hand.surrendered = true
      hand.done = true
      break
  }
}

/** NPCs play until it's a human's turn or the dealer's. */
function npcPlay(s: GameState): GameState {
  let guard = 0
  while (guard++ < 50) {
    const cur = activeHandOf(s)
    if (!cur || cur.seat.human) return s
    const { seat, hand } = cur
    let a = recommendFor(s, seat, hand).action
    const v = handValue(hand.cards)
    if (seat.style === 'cautious' && !v.soft && v.total >= 12 && (a === 'hit' || a === 'surrender')) a = 'stand' // "never bust" player
    if (seat.style === 'gambler' && a === 'surrender') a = 'hit'
    const allowed = actionsFor(s, seat, hand)
    if (!allowed.includes(a)) a = allowed.includes('hit') ? 'hit' : 'stand'
    applyAction(s, seat, hand, a)
    const before = s.activeSeat
    s.seats[before].activeHand = seat.hands.indexOf(hand)
    if (!hand.done) continue
    return advance(s)
  }
  return s
}

function dealerPlay(s: GameState): GameState {
  s.phase = 'dealer'
  s.holeRevealed = true
  s.events.push({ t: 'reveal', card: s.dealer[1] })
  const live = s.seats.some((seat) => seat.hands.some((h) => !h.surrendered && !handValue(h.cards).bust && h.outcome !== 'even-money' && !isNatural(h.cards, h.fromSplit)))
  if (live) {
    while (dealerShouldHit(s.dealer, s.rules)) {
      const card = take(s)
      s.dealer.push(card)
      s.events.push({ t: 'dealer-draw', card })
    }
  }
  const dv = handValue(s.dealer)
  s.events.push({ t: 'dealer-done', total: dv.total, bust: dv.bust })
  return settle(s)
}

/** Settle one hand against a final dealer hand. Returns outcome and net (exported for tests). */
export function settleHand(hand: Pick<PlayerHand, 'cards' | 'bet' | 'fromSplit' | 'surrendered'>, dealer: Card[], rules: TableRules): { outcome: Outcome; net: number } {
  const pv = handValue(hand.cards)
  const dv = handValue(dealer)
  const natural = isNatural(hand.cards, hand.fromSplit)
  const dealerBJ = dv.blackjack
  if (hand.surrendered) return { outcome: 'surrender', net: -hand.bet / 2 }
  if (dealerBJ) return natural ? { outcome: 'push', net: 0 } : { outcome: 'dealer-blackjack', net: -hand.bet }
  if (natural) return { outcome: 'blackjack', net: hand.bet * blackjackMultiplier(rules) }
  if (pv.bust) return { outcome: 'bust', net: -hand.bet }
  if (dv.bust) return { outcome: 'win', net: hand.bet }
  if (pv.total > dv.total) return { outcome: 'win', net: hand.bet }
  if (pv.total < dv.total) return { outcome: 'lose', net: -hand.bet }
  return { outcome: 'push', net: 0 }
}

function settle(s: GameState): GameState {
  s.phase = 'settled'
  s.activeSeat = -1
  for (const seat of s.seats) {
    if (seat.sittingOut) continue
    for (const hand of seat.hands) {
      if (hand.outcome === 'even-money') continue
      const { outcome, net } = settleHand(hand, s.dealer, s.rules)
      hand.outcome = outcome
      hand.net = net
      hand.done = true
      walletOf(s, seat).stack += hand.bet + net
    }
    if (seat.insurance > 0) {
      if (s.dealerBlackjack) {
        seat.insuranceNet = seat.insurance * 2
        walletOf(s, seat).stack += seat.insurance * 3
      } else seat.insuranceNet = -seat.insurance
    }
  }
  s.events.push({ t: 'settle' })
  return s
}

export function seatNet(seat: Seat): number {
  return seat.hands.reduce((n, h) => n + (h.net ?? 0), 0) + (seat.insuranceNet ?? 0)
}

/** Cards visible to the table so far in this shoe (hole card excluded until revealed). */
export function seenCards(state: GameState): Card[] {
  const dealt = state.shoe.cards.slice(state.shuffleMark, state.shoe.pos)
  if (state.phase === 'betting' || state.phase === 'settled' || state.holeRevealed || state.dealer.length < 2) return dealt
  const idx = state.holePos - state.shuffleMark
  if (idx >= 0 && idx < dealt.length) return dealt.slice(0, idx).concat(dealt.slice(idx + 1))
  return dealt
}

export function humanSeats(state: GameState): Seat[] {
  return state.seats.filter((x) => x.human)
}

export function isHumanTurn(state: GameState): boolean {
  const cur = activeHandOf(state)
  return !!cur && cur.seat.human
}

export function activeHand(state: GameState) {
  return activeHandOf(state)
}

export function setStack(state: GameState, seatId: number, stack: number): GameState {
  const s = clone(state)
  s.seats[seatId].stack = stack
  return s
}
