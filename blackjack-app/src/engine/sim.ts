// Fast basic-strategy simulator. Plays real shuffled shoes with the same strategy
// engine and settlement rules as the table, without the per-action state copies the
// interactive engine makes, so thousands of hands run in milliseconds. Used by the
// math lessons (variance, bankroll, house edge) so every chart shows simulated play,
// not invented numbers.
import { buildShoe, type Card } from './cards'
import { dealerShouldHit } from './dealer'
import { handValue, isPair } from './hand'
import { blackjackMultiplier, canDoubleTotal, type TableRules } from './rules'
import { recommend } from './strategy'
import { hiLo } from './count'

export interface SimResult {
  hands: number
  nets: number[]
  wins: number
  losses: number
  pushes: number
  blackjacks: number
  dealerBusts: number
  totalWagered: number
}

export function simulate(rules: TableRules, hands: number, seed: number): SimResult {
  let shoe = buildShoe(rules.decks, seed, rules.penetration)
  let reseed = seed
  const draw = (): Card => {
    if (shoe.pos >= shoe.cards.length) shoe = buildShoe(rules.decks, (reseed = (reseed * 1103515245 + 12345) >>> 0), rules.penetration)
    return shoe.cards[shoe.pos++]
  }
  const res: SimResult = { hands: 0, nets: [], wins: 0, losses: 0, pushes: 0, blackjacks: 0, dealerBusts: 0, totalWagered: 0 }
  for (let n = 0; n < hands; n++) {
    if (shoe.pos >= shoe.cutAt) shoe = buildShoe(rules.decks, (reseed = (reseed * 1103515245 + 12345) >>> 0), rules.penetration)
    const p = [draw()]
    const d = [draw()]
    p.push(draw())
    d.push(draw())
    const net = playOne(rules, p, d, draw, res)
    res.nets.push(net)
    res.hands++
    if (net > 0) res.wins++
    else if (net < 0) res.losses++
    else res.pushes++
  }
  return res
}

interface SimHand { cards: Card[]; bet: number; split: boolean; aces: boolean; surrendered: boolean }

function playOne(rules: TableRules, p: Card[], d: Card[], draw: () => Card, res: SimResult): number {
  const pv = handValue(p)
  const dv = handValue(d)
  res.totalWagered += 1
  if (dv.blackjack) return pv.blackjack ? 0 : -1
  if (pv.blackjack) {
    res.blackjacks++
    return blackjackMultiplier(rules)
  }
  const hands: SimHand[] = [{ cards: p, bet: 1, split: false, aces: false, surrendered: false }]
  for (let i = 0; i < hands.length; i++) {
    const h = hands[i]
    if (h.cards.length === 1) h.cards.push(draw())
    if (h.aces && !rules.hitSplitAces) {
      if (!(isPair(h.cards) && h.cards[0].rank === 'A' && rules.resplitAces && hands.length < rules.maxSplitHands)) continue
    }
    let first = true
    for (;;) {
      const v = handValue(h.cards)
      if (v.total >= 21) break
      const two = h.cards.length === 2 && first
      const canSplit = two && isPair(h.cards) && hands.length < rules.maxSplitHands && (h.cards[0].rank !== 'A' || !h.split || rules.resplitAces)
      const canDouble = two && !(h.aces && !rules.hitSplitAces) && (!h.split || rules.doubleAfterSplit) && canDoubleTotal(v.total, v.soft, rules)
      const canSurrender = two && rules.lateSurrender && !h.split && hands.length === 1
      const a = recommend(h.cards, d[0], rules, { canDouble, canSplit, canSurrender }).action
      first = false
      if (a === 'stand') break
      if (a === 'surrender') { h.surrendered = true; break }
      if (a === 'hit') { if (h.aces && !rules.hitSplitAces) break; h.cards.push(draw()); continue }
      if (a === 'double') { h.bet *= 2; res.totalWagered += 1; h.cards.push(draw()); break }
      if (a === 'split') {
        const aces = h.cards[0].rank === 'A'
        hands.splice(i + 1, 0, { cards: [h.cards[1]], bet: 1, split: true, aces, surrendered: false })
        res.totalWagered += 1
        h.cards = [h.cards[0], draw()]
        h.split = true
        h.aces = aces
        first = true
        if (aces && !rules.hitSplitAces && !(isPair(h.cards) && rules.resplitAces && hands.length < rules.maxSplitHands)) break
        continue
      }
    }
  }
  const live = hands.some((h) => !h.surrendered && !handValue(h.cards).bust)
  if (live) while (dealerShouldHit(d, rules)) d.push(draw())
  const final = handValue(d)
  if (live && final.bust) res.dealerBusts++
  let net = 0
  for (const h of hands) {
    const v = handValue(h.cards)
    if (h.surrendered) net -= 0.5
    else if (v.bust) net -= h.bet
    else if (final.bust || v.total > final.total) net += h.bet
    else if (v.total < final.total) net -= h.bet
  }
  return net
}

export function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}
export function stdev(xs: number[]) {
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

/** Split simulated hands into sessions and report the spread of session results. */
export function sessions(nets: number[], perSession: number): number[] {
  const out: number[] = []
  for (let i = 0; i + perSession <= nets.length; i += perSession) {
    let s = 0
    for (let j = i; j < i + perSession; j++) s += nets[j]
    out.push(s)
  }
  return out
}

/** Fraction of simulated trips that lose the whole bankroll (in units) within maxHands. */
export function riskOfRuin(nets: number[], bankrollUnits: number, maxHands: number): number {
  let ruined = 0
  let trips = 0
  for (let start = 0; start + maxHands <= nets.length; start += maxHands) {
    trips++
    let b = bankrollUnits
    for (let i = start; i < start + maxHands; i++) {
      b += nets[i]
      if (b <= 0) { ruined++; break }
    }
  }
  return trips ? ruined / trips : 0
}

/** Running count stream for a shuffled shoe (count drills). */
export function countStream(decks: number, seed: number, n: number): { cards: Card[]; counts: number[] } {
  const shoe = buildShoe(decks, seed, 0.95)
  const cards = shoe.cards.slice(0, n)
  const counts: number[] = []
  let rc = 0
  for (const c of cards) {
    rc += hiLo(c)
    counts.push(rc)
  }
  return { cards, counts }
}
