import { describe, expect, it } from 'vitest'
import { buildShoe, draw, freshDeck, parseCards, reshuffle, shuffle } from '../cards'
import { createRng } from '../rng'
import { describeHand, handValue, isNatural, isPair } from '../hand'

describe('deck and shoe', () => {
  it('a deck has 52 unique cards', () => {
    const d = freshDeck()
    expect(d).toHaveLength(52)
    expect(new Set(d.map((c) => c.rank + c.suit)).size).toBe(52)
  })
  it('shoes contain the right number of each card', () => {
    for (const decks of [1, 2, 4, 6, 8]) {
      const s = buildShoe(decks, 42)
      expect(s.cards).toHaveLength(52 * decks)
      const aces = s.cards.filter((c) => c.rank === 'A' && c.suit === 'S').length
      expect(aces).toBe(decks)
    }
  })
  it('shuffling is deterministic for a seed and different across seeds', () => {
    const a = buildShoe(6, 7).cards.map((c) => c.rank + c.suit).join()
    const b = buildShoe(6, 7).cards.map((c) => c.rank + c.suit).join()
    const c = buildShoe(6, 8).cards.map((c) => c.rank + c.suit).join()
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
  it('shuffle is a permutation and roughly uniform', () => {
    const rng = createRng(99)
    const counts = Array(5).fill(0)
    for (let i = 0; i < 20000; i++) counts[shuffle([0, 1, 2, 3, 4], rng)[0]]++
    for (const c of counts) expect(Math.abs(c - 4000)).toBeLessThan(300)
  })
  it('cut card sets reshuffle point by penetration', () => {
    const s = buildShoe(6, 1, 0.75)
    expect(s.cutAt).toBe(234)
  })
  it('draw advances without mutating', () => {
    const s = buildShoe(1, 3)
    const { card, shoe } = draw(s)
    expect(s.pos).toBe(0)
    expect(shoe.pos).toBe(1)
    expect(card).toEqual(s.cards[0])
  })
  it('reshuffle produces a fresh full shoe', () => {
    const s = { ...buildShoe(2, 3), pos: 90 }
    const r = reshuffle(s)
    expect(r.pos).toBe(0)
    expect(r.cards).toHaveLength(104)
    expect(r.shuffles).toBe(2)
  })
})

describe('hand evaluation', () => {
  const v = (s: string) => handValue(parseCards(s))
  it('face cards are worth 10', () => expect(v('KS QH').total).toBe(20))
  it('ace counts as 11 when it fits (soft)', () => expect(v('AS 6H')).toMatchObject({ total: 17, soft: true }))
  it('ace drops to 1 to avoid busting (hard)', () => expect(v('AS 6H 9D')).toMatchObject({ total: 16, soft: false }))
  it('multiple aces', () => {
    expect(v('AS AH')).toMatchObject({ total: 12, soft: true })
    expect(v('AS AH 9D')).toMatchObject({ total: 21, soft: true })
    expect(v('AS AH AD AC')).toMatchObject({ total: 14, soft: true })
    expect(v('AS AH KD')).toMatchObject({ total: 12, soft: false })
  })
  it('bust', () => expect(v('KS 6H 9D')).toMatchObject({ total: 25, bust: true }))
  it('blackjack is two-card 21 only', () => {
    expect(v('AS KD').blackjack).toBe(true)
    expect(v('7S 7D 7H').blackjack).toBe(false)
    expect(v('7S 7D 7H').total).toBe(21)
  })
  it('split hands never count as naturals', () => {
    expect(isNatural(parseCards('AS KD'), false)).toBe(true)
    expect(isNatural(parseCards('AS KD'), true)).toBe(false)
  })
  it('pairs by value', () => {
    expect(isPair(parseCards('8S 8D'))).toBe(true)
    expect(isPair(parseCards('KS 10D'))).toBe(true)
    expect(isPair(parseCards('8S 9D'))).toBe(false)
  })
  it('describes hands', () => {
    expect(describeHand(parseCards('10S 6D'))).toBe('Hard 16')
    expect(describeHand(parseCards('AS 7D'))).toBe('Soft 18')
    expect(describeHand(parseCards('8S 8D'))).toBe('Pair of 8s')
    expect(describeHand(parseCards('AS KD'))).toBe('Blackjack')
  })
})
