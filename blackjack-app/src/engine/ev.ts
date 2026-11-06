// Expected-value calculator (infinite-deck model).
//
// Every probability and EV the teaching dealer quotes comes from here, computed,
// not typed in. The infinite-deck model draws each rank with fixed probability
// (Ace…9 = 1/13 each, ten-value = 4/13). It is the standard approximation for
// multi-deck shoes; values are per 1 unit bet and, when the dealer shows an Ace or
// ten, are conditioned on the dealer not having blackjack (American peek rules),
// because that is the only situation in which the player gets to decide.
// Split EV plays each split hand optimally but does not model resplits, so it is a
// slight underestimate.
import type { Card } from './cards'
import { cardPoints } from './cards'
import { handValue, isPair } from './hand'
import type { TableRules } from './rules'
import type { Action } from './strategy'

export const RANK_PROB: number[] = [0, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 4 / 13]
// index 1 = Ace, 2..9, 10 = ten-value

export type DealerFinal = 17 | 18 | 19 | 20 | 21 | 'bust'
export interface DealerDist {
  17: number; 18: number; 19: number; 20: number; 21: number; bust: number
  /** Probability of a dealer natural (only non-zero when not conditioned). */
  blackjack: number
}

function best(hard: number, ace: boolean) {
  return ace && hard + 10 <= 21 ? { total: hard + 10, soft: true } : { total: hard, soft: false }
}

const dealerCache = new Map<string, DealerDist>()

/**
 * Final-total distribution for the dealer given an upcard value (1 = Ace, 10 = ten).
 * conditionNoBlackjack: exclude hole cards that would give the dealer a natural.
 */
export function dealerDistribution(up: number, h17: boolean, conditionNoBlackjack = true, P: number[] = RANK_PROB): DealerDist {
  const key = `${up}|${h17}|${conditionNoBlackjack}|${P === RANK_PROB ? '' : P.join(',')}`
  const hit = dealerCache.get(key)
  if (hit) return hit
  const memo = new Map<string, Omit<DealerDist, 'blackjack'>>()
  const finish = (hard: number, ace: boolean): Omit<DealerDist, 'blackjack'> => {
    const k = `${hard}|${ace}`
    const m = memo.get(k)
    if (m) return m
    const b = best(hard, ace)
    let out: Omit<DealerDist, 'blackjack'>
    if (b.total > 21) out = { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, bust: 1 }
    else if (b.total > 17 || (b.total === 17 && !(b.soft && h17))) {
      out = { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, bust: 0 }
      out[b.total as 17] = 1
    } else {
      out = { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, bust: 0 }
      for (let c = 1; c <= 10; c++) {
        const sub = finish(hard + c, ace || c === 1)
        for (const f of [17, 18, 19, 20, 21, 'bust'] as const) out[f] += P[c] * sub[f]
      }
    }
    memo.set(k, out)
    return out
  }
  const out: DealerDist = { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, bust: 0, blackjack: 0 }
  let mass = 0
  for (let c = 1; c <= 10; c++) {
    const natural = (up === 1 && c === 10) || (up === 10 && c === 1)
    if (natural) {
      if (!conditionNoBlackjack) out.blackjack += P[c]
      if (conditionNoBlackjack) continue
      mass += P[c]
      continue
    }
    mass += P[c]
    const sub = finish(up + c, up === 1 || c === 1)
    for (const f of [17, 18, 19, 20, 21, 'bust'] as const) out[f] += P[c] * sub[f]
  }
  for (const f of [17, 18, 19, 20, 21, 'bust', 'blackjack'] as const) out[f] /= mass
  dealerCache.set(key, out)
  return out
}

export function standEV(total: number, d: DealerDist): number {
  if (total > 21) return -1
  let ev = d.bust
  for (const f of [17, 18, 19, 20, 21] as const) {
    if (f < total) ev += d[f]
    else if (f > total) ev -= d[f]
  }
  return ev
}

export interface OptionEVs {
  stand: number
  hit: number
  double: number
  surrender: number
  /** Only when the hand is a splittable pair. */
  split?: number
}

class Solver {
  private hitMemo = new Map<string, number>()
  constructor(private d: DealerDist, private P: number[] = RANK_PROB) {}
  stand(hard: number, ace: boolean) {
    return standEV(best(hard, ace).total, this.d)
  }
  /** EV of hitting once and then continuing optimally (hit/stand only). */
  hit(hard: number, ace: boolean): number {
    const k = `${hard}|${ace}`
    const m = this.hitMemo.get(k)
    if (m !== undefined) return m
    let ev = 0
    for (let c = 1; c <= 10; c++) {
      const h = hard + c
      const a = ace || c === 1
      if (best(h, a).total > 21) ev += this.P[c] * -1
      else ev += this.P[c] * Math.max(this.stand(h, a), best(h, a).total === 21 ? -Infinity : this.hit(h, a))
    }
    this.hitMemo.set(k, ev)
    return ev
  }
  double(hard: number, ace: boolean): number {
    let ev = 0
    for (let c = 1; c <= 10; c++) {
      const h = hard + c
      const a = ace || c === 1
      ev += this.P[c] * 2 * (best(h, a).total > 21 ? -1 : this.stand(h, a))
    }
    return ev
  }
  /** Best of stand/hit (and double if allowed) for a two-card hand. */
  play(hard: number, ace: boolean, canDouble: boolean): number {
    const b = best(hard, ace).total
    const opts = [this.stand(hard, ace)]
    if (b < 21) opts.push(this.hit(hard, ace))
    if (canDouble) opts.push(this.double(hard, ace))
    return Math.max(...opts)
  }
}

const solverCache = new Map<string, Solver>()
function solver(up: number, h17: boolean, P: number[] = RANK_PROB) {
  const k = `${up}|${h17}|${P === RANK_PROB ? '' : P.join(',')}`
  let s = solverCache.get(k)
  if (!s) {
    s = new Solver(dealerDistribution(up, h17, true, P), P)
    solverCache.set(k, s)
  }
  return s
}

function upValue(card: Card): number {
  return card.rank === 'A' ? 1 : cardPoints(card.rank)
}

/** EVs of every option for a hand, per 1 unit of the hand's original bet. */
export function optionEVs(cards: readonly Card[], dealerUp: Card, rules: Pick<TableRules, 'dealerHitsSoft17' | 'doubleAfterSplit' | 'hitSplitAces'>): OptionEVs {
  const s = solver(upValue(dealerUp), rules.dealerHitsSoft17)
  let hard = 0
  let ace = false
  for (const c of cards) {
    hard += cardPoints(c.rank)
    if (c.rank === 'A') ace = true
  }
  const total = best(hard, ace).total
  const out: OptionEVs = {
    stand: s.stand(hard, ace),
    hit: total >= 21 ? -1 : s.hit(hard, ace),
    double: s.double(hard, ace),
    surrender: -0.5,
  }
  if (isPair(cards)) out.split = splitEV(cards[0], dealerUp, rules)
  return out
}

/** Two split hands, each starting from one card of the pair (no resplits). */
export function splitEV(card: Card, dealerUp: Card, rules: Pick<TableRules, 'dealerHitsSoft17' | 'doubleAfterSplit' | 'hitSplitAces'>, P: number[] = RANK_PROB): number {
  const s = solver(upValue(dealerUp), rules.dealerHitsSoft17, P)
  const x = cardPoints(card.rank)
  const isAce = card.rank === 'A'
  let ev = 0
  for (let c = 1; c <= 10; c++) {
    const hard = x + c
    const ace = isAce || c === 1
    const v = isAce && !rules.hitSplitAces ? s.stand(hard, ace) : s.play(hard, ace, rules.doubleAfterSplit)
    ev += P[c] * v
  }
  return 2 * ev
}

/** Probability that one more card busts a hand (infinite deck). */
export function bustChanceOnHit(cards: readonly Card[]): number {
  const v = handValue(cards)
  if (v.soft) return 0
  let p = 0
  for (let c = 1; c <= 10; c++) if (v.total + c > 21) p += RANK_PROB[c]
  return p
}

/** Dealer bust chance for an upcard, after the dealer has checked for blackjack. */
export function dealerBustChance(dealerUp: Card, h17: boolean): number {
  return dealerDistribution(upValue(dealerUp), h17, true).bust
}

/** Insurance EV per 1 unit insured, given how many ten-value cards are among the unseen cards. */
export function insuranceEV(tensUnseen: number, cardsUnseen: number): number {
  if (cardsUnseen <= 0) return 0
  const p = tensUnseen / cardsUnseen
  return 2 * p - (1 - p)
}

export function bestOption(evs: OptionEVs, allowed: readonly Action[]): { action: Action; ev: number } {
  let bestA: Action = 'stand'
  let bestV = -Infinity
  for (const a of allowed) {
    const v = a === 'split' ? evs.split ?? -Infinity : evs[a]
    if (v > bestV) {
      bestV = v
      bestA = a
    }
  }
  return { action: bestA, ev: bestV }
}

export function formatEV(ev: number): string {
  const cents = Math.round(ev * 1000) / 10
  return `${cents > 0 ? '+' : ''}${cents.toFixed(1)}%`
}

export function pct(p: number, digits = 0): string {
  return `${(p * 100).toFixed(digits)}%`
}

/**
 * Overall player expectation off the top for a rule set, computed (infinite-deck
 * model) by weighting every starting hand and dealer upcard. Player always plays
 * the EV-best option; insurance is never taken. Negative = house edge.
 */
export function playerExpectation(rules: Pick<TableRules, 'dealerHitsSoft17' | 'doubleAfterSplit' | 'hitSplitAces' | 'lateSurrender' | 'blackjackPayout'>, P: number[] = RANK_PROB): number {
  const bj = rules.blackjackPayout === '3:2' ? 1.5 : 1.2
  let total = 0
  for (let up = 1; up <= 10; up++) {
    const pUp = P[up]
    const pDealerBJ = up === 1 ? P[10] : up === 10 ? P[1] : 0
    const s = solver(up, rules.dealerHitsSoft17, P)
    let evNoBJ = 0
    for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
      const p = P[a] * P[b]
      const natural = (a === 1 && b === 10) || (a === 10 && b === 1)
      if (natural) {
        evNoBJ += p * bj
        continue
      }
      const hard = a + b
      const ace = a === 1 || b === 1
      const opts = [s.stand(hard, ace), s.hit(hard, ace), s.double(hard, ace)]
      if (rules.lateSurrender) opts.push(-0.5)
      if (a === b) {
        const card = { rank: (a === 1 ? 'A' : String(a)) as Card['rank'], suit: 'S' as const }
        const upCard = { rank: (up === 1 ? 'A' : String(up)) as Card['rank'], suit: 'S' as const }
        opts.push(splitEV(card, upCard, rules, P))
      }
      evNoBJ += p * Math.max(...opts)
    }
    const pNat = 2 * P[1] * P[10]
    const evBJ = -(1 - pNat) // player loses unless they also have a natural (push)
    total += pUp * (pDealerBJ * evBJ + (1 - pDealerBJ) * evNoBJ)
  }
  return total
}

/**
 * Effect of removing one card of a rank from a single 52-card deck, on the player's
 * off-the-top expectation (percentage points). Uses the infinite-deck solver with the
 * adjusted rank probabilities, a standard approximation for effects of removal.
 */
export function removalEffects(rules: Parameters<typeof playerExpectation>[0]): { rank: number; effect: number }[] {
  const base = playerExpectation(rules)
  const out: { rank: number; effect: number }[] = []
  for (let r = 1; r <= 10; r++) {
    const counts = [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 16]
    counts[r] -= 1
    const P = counts.map((c) => c / 51)
    out.push({ rank: r, effect: playerExpectation(rules, P) - base })
  }
  return out
}
