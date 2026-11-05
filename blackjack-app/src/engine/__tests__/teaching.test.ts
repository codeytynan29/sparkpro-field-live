import { describe, expect, it } from 'vitest'
import { act, insuranceDecision, startRound } from '../game'
import { breakdownHand, explainRecommendation, feedbackForDecision, hintFor, verdictFor } from '../teaching'
import { hiLo, runningCount, trueCount, deviationFor, trueCountForPlay, rampUnits } from '../count'
import { parseCard, parseCards } from '../cards'
import { recommend } from '../strategy'
import { DEFAULT_RULES } from '../rules'
import { table } from './fixtures'

const noLS = { lateSurrender: false }

function round(cards: string, action: 'hit' | 'stand' | 'double' | 'split' | 'surrender', rules = {}) {
  const s = act(startRound(table(cards, rules), { 0: 10 }), action)
  const hand = s.seats[0].hands[0]
  return { s, b: breakdownHand(hand, s.dealer, s.decisions, s.rules, 0) }
}

describe('teaching dealer separates decisions from outcomes', () => {
  it('verdict matrix', () => {
    expect(verdictFor(true, -10)).toBe('correct-loss')
    expect(verdictFor(false, 10)).toBe('mistake-win')
    expect(verdictFor(true, 10)).toBe('correct-win')
    expect(verdictFor(false, -10)).toBe('mistake-loss')
    expect(verdictFor(true, 0)).toBe('correct-push')
  })
  it('16 vs 10, stand, dealer makes 20 → wrong play that lost', () => {
    const { b } = round('10S 10H 6D KC', 'stand', noLS)
    expect(b.verdict).toBe('mistake-loss')
    expect(b.dealerSays).toMatch(/hit/i)
  })
  it('16 vs 10, stand, dealer busts → won but still a mistake', () => {
    const { b } = round('10S 10H 6D 6C KD', 'stand', noLS)
    expect(b.net).toBe(10)
    expect(b.verdict).toBe('mistake-win')
    expect(b.title).toMatch(/wrong play/i)
    expect(b.dealerSays).toMatch(/doesn’t make it right/)
  })
  it('16 vs 6, stand, dealer busts → correct and won', () => {
    const { b } = round('10S 6H 6D 10C 9S', 'stand')
    expect(b.verdict).toBe('correct-win')
    expect(b.dealerSays).toMatch(/weak card/)
  })
  it('16 vs 10, hit, bust → correct play that lost', () => {
    const { b } = round('10S 10H 6D 7C 9S', 'hit', noLS)
    expect(b.verdict).toBe('correct-loss')
    expect(b.title).toBe('Bad luck, good decision')
  })
  it('naturals produce a lesson without a verdict', () => {
    const s = startRound(table('AS 9H KD 7C'), { 0: 10 })
    const b = breakdownHand(s.seats[0].hands[0], s.dealer, s.decisions, s.rules)
    expect(b.verdict).toBeNull()
    expect(b.lesson).toMatch(/3:2/)
  })
  it('insurance feedback says decline, with the real math', () => {
    const s = insuranceDecision(startRound(table('10S AH 9D 7C'), { 0: 10 }), 0, true)
    const f = feedbackForDecision(s.decisions[0], s.rules)
    expect(f.correct).toBe(false)
    expect(f.why).toMatch(/7\.7%/)
  })
  it('mistake feedback quantifies the cost from the EV engine', () => {
    const s = act(startRound(table('6S 6H 5D 10C 10S'), { 0: 10 }), 'hit')
    const f = feedbackForDecision(s.decisions[0], s.rules)
    expect(f.correct).toBe(false)
    expect(f.message).toMatch(/costs about/)
    expect(f.evRows[0].action).toBe('double')
  })
  it('explanations quote computed dealer bust rates', () => {
    const r = recommend(parseCards('10S 3H'), parseCard('6D'), DEFAULT_RULES, { canDouble: true, canSplit: false, canSurrender: false })
    expect(explainRecommendation(parseCards('10S 3H'), parseCard('6D'), r, DEFAULT_RULES)).toMatch(/42%/)
  })
  it('hints never reveal the answer', () => {
    const h = hintFor(parseCards('10S 6H'), parseCard('KD'), DEFAULT_RULES)
    expect(h).not.toMatch(/\b(hit|stand) (here|now)\b/i)
    expect(h).toMatch(/62%/)
  })
})

describe('card counting', () => {
  it('Hi-Lo values', () => {
    expect(parseCards('2S 3S 4S 5S 6S').map(hiLo)).toEqual([1, 1, 1, 1, 1])
    expect(parseCards('7S 8S 9S').map(hiLo)).toEqual([0, 0, 0])
    expect(parseCards('10S JS QS KS AS').map(hiLo)).toEqual([-1, -1, -1, -1, -1])
  })
  it('a full deck counts to zero (balanced count)', () => {
    const deck = parseCards('AS 2S 3S 4S 5S 6S 7S 8S 9S 10S JS QS KS')
    expect(runningCount([...deck, ...deck, ...deck, ...deck])).toBe(0)
  })
  it('true count divides by decks remaining', () => {
    expect(trueCount(6, 3)).toBe(2)
    expect(trueCount(-4, 2)).toBe(-2)
    expect(trueCountForPlay(5, 2)).toBe(2)
    expect(trueCountForPlay(-5, 2)).toBe(-2)
  })
  it('index plays', () => {
    expect(deviationFor(parseCards('10S 6H'), parseCard('KD'), 0)?.deviation).toBe('stand')
    expect(deviationFor(parseCards('10S 6H'), parseCard('KD'), -1)).toBeNull()
    expect(deviationFor(parseCards('KS QH'), parseCard('6D'), 4)?.deviation).toBe('split')
    expect(deviationFor(parseCards('10S 2H'), parseCard('4D'), -1)?.deviation).toBe('hit')
  })
  it('bet ramp', () => {
    expect(rampUnits(-3)).toBe(1)
    expect(rampUnits(1.9)).toBe(1)
    expect(rampUnits(3)).toBe(4)
    expect(rampUnits(9)).toBe(8)
  })
})
