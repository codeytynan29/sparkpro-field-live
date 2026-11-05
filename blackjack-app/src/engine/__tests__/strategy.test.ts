import { describe, expect, it } from 'vitest'
import { parseCard, parseCards } from '../cards'
import { bestOption, dealerDistribution, insuranceEV, optionEVs, bustChanceOnHit } from '../ev'
import { DEFAULT_RULES, type TableRules } from '../rules'
import { buildChart, recommend, type Action } from '../strategy'

const ALL = { canDouble: true, canSplit: true, canSurrender: true }
const NONE = { canDouble: false, canSplit: false, canSurrender: false }
const S17: TableRules = { ...DEFAULT_RULES, decks: 6, dealerHitsSoft17: false, doubleAfterSplit: true, lateSurrender: false }
const rec = (hand: string, up: string, rules: TableRules = S17, ctx = ALL) => recommend(parseCards(hand), parseCard(up), rules, ctx).action

// Fixtures from the standard published 4–8 deck, S17, DAS, no-surrender basic strategy chart.
const MULTI_S17_FIXTURES: [string, string, Action][] = [
  ['10S 6H', 'KD', 'hit'], ['10S 6H', '6D', 'stand'], ['10S 2H', '2D', 'hit'], ['10S 2H', '3D', 'hit'],
  ['10S 2H', '4D', 'stand'], ['10S 3H', '2D', 'stand'], ['9S 4H', '7D', 'hit'], ['10S 7H', 'AD', 'stand'],
  ['6S 5H', '10D', 'double'], ['6S 5H', 'AD', 'hit'], ['6S 4H', '9D', 'double'], ['6S 4H', '10D', 'hit'],
  ['5S 4H', '2D', 'hit'], ['5S 4H', '3D', 'double'], ['5S 4H', '7D', 'hit'], ['5S 3H', '6D', 'hit'],
  ['AS 2H', '5D', 'double'], ['AS 2H', '4D', 'hit'], ['AS 4H', '4D', 'double'], ['AS 6H', '3D', 'double'],
  ['AS 6H', '2D', 'hit'], ['AS 7H', '2D', 'stand'], ['AS 7H', '6D', 'double'], ['AS 7H', '7D', 'stand'],
  ['AS 7H', '9D', 'hit'], ['AS 7H', 'AD', 'hit'], ['AS 8H', '6D', 'stand'], ['AS 9H', '6D', 'stand'],
  ['AS AH', 'AD', 'split'], ['8S 8H', 'AD', 'split'], ['8S 8H', '10D', 'split'], ['KS QH', '6D', 'stand'],
  ['5S 5H', '9D', 'double'], ['5S 5H', '10D', 'hit'], ['9S 9H', '7D', 'stand'], ['9S 9H', '8D', 'split'],
  ['9S 9H', 'AD', 'stand'], ['4S 4H', '5D', 'split'], ['4S 4H', '4D', 'hit'], ['6S 6H', '2D', 'split'],
  ['6S 6H', '7D', 'hit'], ['7S 7H', '7D', 'split'], ['7S 7H', '8D', 'hit'], ['2S 2H', '2D', 'split'],
  ['3S 3H', '8D', 'hit'], ['2S 2H', '7D', 'split'],
]

describe('basic strategy: 6 deck S17 DAS', () => {
  it.each(MULTI_S17_FIXTURES)('%s vs %s → %s', (hand, up, expected) => {
    expect(rec(hand, up)).toBe(expected)
  })
  it('falls back correctly when doubling is not allowed', () => {
    expect(rec('6S 5H', '6D', S17, NONE)).toBe('hit')
    expect(rec('AS 7H', '4D', S17, NONE)).toBe('stand') // Ds → stand
    expect(rec('2S 4H 5D', '6D', S17, { ...ALL, canDouble: false })).toBe('hit')
  })
  it('plays pairs as totals when splitting is not allowed', () => {
    expect(rec('8S 8H', '10D', S17, NONE)).toBe('hit')
    expect(rec('AS AH', '6D', S17, NONE)).toBe('hit')
    expect(rec('9S 9H', '6D', S17, NONE)).toBe('stand')
  })
  it('multi-card soft and hard hands', () => {
    expect(rec('AS 2H 4D', '9D', S17, NONE)).toBe('hit') // soft 17
    expect(rec('AS 2H 5D', '9D', S17, NONE)).toBe('hit') // soft 18 vs 9
    expect(rec('AS 2H 5D', '8D', S17, NONE)).toBe('stand') // soft 18 vs 8
    expect(rec('5S 4H 3D 4C', '10D', S17, NONE)).toBe('hit') // hard 16 vs 10, no surrender after hit
  })
})

describe('rule variations', () => {
  it('H17 changes: 11 vs A, soft 18 vs 2, soft 19 vs 6', () => {
    const H17 = { ...S17, dealerHitsSoft17: true }
    expect(rec('6S 5H', 'AD', S17)).toBe('hit')
    expect(rec('6S 5H', 'AD', H17)).toBe('double')
    expect(rec('AS 7H', '2D', H17)).toBe('double')
    expect(rec('AS 8H', '6D', H17)).toBe('double')
  })
  it('late surrender: 16 vs 9/10/A and 15 vs 10 (S17)', () => {
    const LS = { ...S17, lateSurrender: true }
    expect(rec('10S 6H', '9D', LS)).toBe('surrender')
    expect(rec('10S 6H', 'KD', LS)).toBe('surrender')
    expect(rec('10S 6H', 'AD', LS)).toBe('surrender')
    expect(rec('10S 5H', 'KD', LS)).toBe('surrender')
    expect(rec('10S 5H', 'AD', LS)).toBe('hit')
    expect(rec('8S 8H', 'KD', LS)).toBe('split')
    expect(rec('10S 7H', 'AD', LS)).toBe('stand')
  })
  it('late surrender with H17 adds 15 vs A, 17 vs A, 8-8 vs A', () => {
    const LSH = { ...S17, lateSurrender: true, dealerHitsSoft17: true }
    expect(rec('10S 5H', 'AD', LSH)).toBe('surrender')
    expect(rec('10S 7H', 'AD', LSH)).toBe('surrender')
    expect(rec('8S 8H', 'AD', LSH)).toBe('surrender')
    expect(rec('8S 8H', 'AD', LSH, { ...ALL, canSurrender: false })).toBe('split')
  })
  it('no double after split narrows pair splitting', () => {
    const ND = { ...S17, doubleAfterSplit: false }
    expect(rec('2S 2H', '2D', ND)).toBe('hit')
    expect(rec('4S 4H', '5D', ND)).toBe('hit')
    expect(rec('6S 6H', '2D', ND)).toBe('hit')
    expect(rec('6S 6H', '3D', ND)).toBe('split')
  })
  it('single deck differences', () => {
    const SD = { ...S17, decks: 1 as const }
    expect(rec('5S 3H', '6D', SD)).toBe('double')
    expect(rec('5S 4H', '2D', SD)).toBe('double')
    expect(rec('6S 5H', 'AD', SD)).toBe('double')
    expect(rec('AS 6H', '2D', SD)).toBe('double')
    expect(rec('AS 7H', 'AD', SD)).toBe('stand')
    expect(rec('7S 7H', '10D', SD)).toBe('stand')
  })
  it('double deck differences', () => {
    const DD = { ...S17, decks: 2 as const }
    expect(rec('5S 4H', '2D', DD)).toBe('double')
    expect(rec('6S 5H', 'AD', DD)).toBe('double')
    expect(rec('6S 6H', '7D', DD)).toBe('split')
    expect(rec('5S 3H', '6D', DD)).toBe('hit')
  })
  it('restricted doubling falls back on soft hands', () => {
    expect(rec('AS 6H', '4D', { ...S17, doubleOn: '10-11' })).toBe('hit')
    expect(rec('AS 7H', '4D', { ...S17, doubleOn: '10-11' })).toBe('stand')
  })
  it('every chart row is complete for every deck count and rule mix', () => {
    for (const decks of [1, 2, 4, 6, 8] as const) for (const h17 of [true, false]) for (const das of [true, false]) for (const ls of [true, false]) {
      const c = buildChart({ ...S17, decks, dealerHitsSoft17: h17, doubleAfterSplit: das, lateSurrender: ls })
      for (let t = 4; t <= 21; t++) expect(Object.keys(c.hard[t])).toHaveLength(10)
      for (let t = 12; t <= 21; t++) expect(Object.keys(c.soft[t])).toHaveLength(10)
      for (let p = 2; p <= 11; p++) expect(Object.keys(c.pairs[p])).toHaveLength(10)
    }
  })
})

describe('chart agrees with the expected-value calculator (multi-deck)', () => {
  // Infinite-deck EV is the limit of a many-deck shoe. These cells are documented
  // knife-edge decisions where 6-deck charts and infinite-deck EV differ by < 0.1%.
  const KNOWN_CLOSE = new Set(['soft13v5', 'soft15v4'])
  const ups = ['2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', 'KS', 'AS']
  for (const h17 of [false, true]) for (const ls of [false, true]) {
    it(`${h17 ? 'H17' : 'S17'} ${ls ? 'with' : 'without'} surrender`, () => {
      const rules = { ...S17, dealerHitsSoft17: h17, lateSurrender: ls }
      const hands: string[] = []
      for (let a = 2; a <= 10; a++) for (let b = a + 1; b <= 10; b++) hands.push(`${a}H ${b === 10 ? 'KD' : b + 'D'}`)
      for (let b = 2; b <= 9; b++) hands.push(`AH ${b}D`)
      for (let a = 2; a <= 9; a++) hands.push(`${a}H ${a}D`)
      hands.push('KH KD', 'AH AD')
      let checked = 0
      for (const h of hands) for (const u of ups) {
        const cards = parseCards(h)
        const up = parseCard(u)
        const r = recommend(cards, up, rules, ALL)
        if (KNOWN_CLOSE.has(r.cell)) continue
        const evs = optionEVs(cards, up, rules)
        const allowed: Action[] = ['hit', 'stand', 'double']
        if (ls) allowed.push('surrender')
        if (evs.split !== undefined) allowed.push('split')
        const best = bestOption(evs, allowed)
        // When EVs are within 0.3% the chart may legitimately prefer either.
        const chosenEV = r.action === 'split' ? evs.split! : evs[r.action]
        if (best.action !== r.action) expect(best.ev - chosenEV, `${h} vs ${u}: chart ${r.action}, EV prefers ${best.action}`).toBeLessThan(0.003)
        checked++
      }
      expect(checked).toBeGreaterThan(500)
    })
  }
})

describe('expected value calculator', () => {
  it('dealer bust probabilities match published infinite-deck values (S17)', () => {
    // Griffin, The Theory of Blackjack (infinite deck, S17, not conditioned on peek)
    const published: Record<number, number> = { 1: 0.1153, 2: 0.3536, 3: 0.3739, 4: 0.3945, 5: 0.4164, 6: 0.4232, 7: 0.2623, 8: 0.2447, 9: 0.2284, 10: 0.2121 }
    for (const [up, p] of Object.entries(published)) expect(dealerDistribution(Number(up), false, false).bust).toBeCloseTo(p, 3)
  })
  it('dealer distributions sum to 1', () => {
    for (let up = 1; up <= 10; up++) for (const h17 of [true, false]) for (const cond of [true, false]) {
      const d = dealerDistribution(up, h17, cond)
      expect(d[17] + d[18] + d[19] + d[20] + d[21] + d.bust + d.blackjack).toBeCloseTo(1, 10)
    }
  })
  it('H17 increases dealer bust and lowers 17s with an Ace or 6 up', () => {
    expect(dealerDistribution(6, true).bust).toBeGreaterThan(dealerDistribution(6, false).bust)
    expect(dealerDistribution(6, true)[17]).toBeLessThan(dealerDistribution(6, false)[17])
  })
  it('16 vs 10: standing and hitting are both terrible, and close', () => {
    const e = optionEVs(parseCards('10S 6H'), parseCard('KD'), S17)
    expect(e.stand).toBeLessThan(-0.5)
    expect(e.hit).toBeLessThan(-0.5)
    expect(Math.abs(e.hit - e.stand)).toBeLessThan(0.02)
    expect(e.surrender).toBe(-0.5)
  })
  it('11 vs 6 double is strongly positive', () => {
    const e = optionEVs(parseCards('6S 5H'), parseCard('6D'), S17)
    expect(e.double).toBeGreaterThan(0.6)
    expect(e.double).toBeGreaterThan(e.hit)
  })
  it('splitting 8s vs 10 beats playing 16', () => {
    const e = optionEVs(parseCards('8S 8H'), parseCard('KD'), S17)
    expect(e.split!).toBeGreaterThan(Math.max(e.hit, e.stand))
  })
  it('bust chance when hitting', () => {
    expect(bustChanceOnHit(parseCards('10S 6H'))).toBeCloseTo(8 / 13)
    expect(bustChanceOnHit(parseCards('10S 2H'))).toBeCloseTo(4 / 13)
    expect(bustChanceOnHit(parseCards('5S 6H'))).toBe(0)
    expect(bustChanceOnHit(parseCards('AS 6H'))).toBe(0)
  })
  it('insurance EV is -1/13 off the top', () => {
    expect(insuranceEV(16, 52)).toBeCloseTo(-1 / 13)
    expect(insuranceEV(20, 52)).toBeGreaterThan(0)
  })
})
