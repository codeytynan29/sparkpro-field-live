import { describe, expect, it } from 'vitest'
import { parseCards } from '../cards'
import { dealerShouldHit } from '../dealer'
import { act, availableActions, createGame, GameError, insuranceDecision, seatNet, seenCards, settleHand, startRound, evenMoneyIsCorrect } from '../game'
import { DEFAULT_RULES } from '../rules'
import { stackedShoe } from '../cards'
import { table } from './fixtures'

const R = DEFAULT_RULES

describe('dealer drawing rules', () => {
  it('hits below 17, stands on hard 17+', () => {
    expect(dealerShouldHit(parseCards('10S 6H'), R)).toBe(true)
    expect(dealerShouldHit(parseCards('10S 7H'), R)).toBe(false)
  })
  it('S17 stands on soft 17, H17 hits it', () => {
    expect(dealerShouldHit(parseCards('AS 6H'), { dealerHitsSoft17: false })).toBe(false)
    expect(dealerShouldHit(parseCards('AS 6H'), { dealerHitsSoft17: true })).toBe(true)
    expect(dealerShouldHit(parseCards('AS 7H'), { dealerHitsSoft17: true })).toBe(false)
    expect(dealerShouldHit(parseCards('AS 2H 4D'), { dealerHitsSoft17: true })).toBe(true)
    expect(dealerShouldHit(parseCards('10S 6H AD'), { dealerHitsSoft17: true })).toBe(false) // hard 17
  })
  it('plays out S17 vs H17 differently in a real round', () => {
    // player 10,8 ; dealer A,6 (soft 17); next card 4 → H17 dealer makes 21
    // dealer upcard A → insurance offered first
    expect(startRound(table('10S AH 8D 6C 4S'), { 0: 10 }).phase).toBe('insurance')
    const a = act(insuranceDecision(startRound(table('10S AH 8D 6C 4S', { dealerHitsSoft17: false }), { 0: 10 }), 0, false), 'stand')
    expect(a.dealer).toHaveLength(2)
    expect(a.seats[0].hands[0].outcome).toBe('win') // 18 beats 17
    const b = act(insuranceDecision(startRound(table('10S AH 8D 6C 4S', { dealerHitsSoft17: true }), { 0: 10 }), 0, false), 'stand')
    expect(b.dealer).toHaveLength(3)
    expect(b.seats[0].hands[0].outcome).toBe('lose') // dealer 21
  })
})

function play(cards: string, actions: string[], rules = {}, bet = 10) {
  let s = startRound(table(cards, rules), { 0: bet })
  for (const a of actions) {
    if (a === 'ins') s = insuranceDecision(s, 0, true)
    else if (a === 'noins') s = insuranceDecision(s, 0, false)
    else s = act(s, a as never)
  }
  return s
}

describe('settlement and payouts', () => {
  it('natural pays 3:2', () => {
    const s = play('AS 9H KD 7C', [])
    expect(s.phase).toBe('settled')
    expect(s.seats[0].hands[0].outcome).toBe('blackjack')
    expect(s.seats[0].hands[0].net).toBe(15)
    expect(s.seats[0].stack).toBe(1015)
  })
  it('natural pays 6:5 when configured', () => {
    const s = play('AS 9H KD 7C', [], { blackjackPayout: '6:5' })
    expect(s.seats[0].hands[0].net).toBe(12)
  })
  it('dealer does not draw when only a natural is in play', () => {
    const s = play('AS 6H KD 5C 9S', [])
    expect(s.dealer).toHaveLength(2)
  })
  it('three-card 21 is not a blackjack and pays 1:1', () => {
    const s = play('7S 10H 7D 8C 7H', ['hit'])
    expect(s.seats[0].hands[0].cards).toHaveLength(3)
    expect(s.seats[0].hands[0].outcome).toBe('win')
    expect(s.seats[0].hands[0].net).toBe(10)
  })
  it('three-card 21 pushes against dealer three-card 21 but loses to dealer blackjack', () => {
    expect(settleHand({ cards: parseCards('7S 7D 7H'), bet: 10, fromSplit: false, surrendered: false }, parseCards('10S 5D 6H'), R)).toEqual({ outcome: 'push', net: 0 })
    expect(settleHand({ cards: parseCards('7S 7D 7H'), bet: 10, fromSplit: false, surrendered: false }, parseCards('AS KD'), R)).toEqual({ outcome: 'dealer-blackjack', net: -10 })
  })
  it('player blackjack pushes dealer blackjack', () => {
    const s = play('AS AH KD KC', ['noins'])
    expect(s.seats[0].hands[0].outcome).toBe('push')
    expect(s.seats[0].stack).toBe(1000)
  })
  it('bust loses even if the dealer busts later', () => {
    const s = play('10S 6H 6D 10C 9S', ['hit'])
    expect(s.seats[0].hands[0].outcome).toBe('bust')
    expect(s.seats[0].stack).toBe(990)
    expect(s.dealer).toHaveLength(2) // nobody left to play against
  })
  it('dealer bust pays live hands', () => {
    const s = play('10S 6H 8D 10C 9S', ['stand'])
    expect(s.seats[0].hands[0].outcome).toBe('win')
    expect(s.seats[0].stack).toBe(1010)
  })
  it('push returns the bet', () => {
    const s = play('10S 10H 8D 8C', ['stand'])
    expect(s.seats[0].hands[0].outcome).toBe('push')
    expect(s.seats[0].stack).toBe(1000)
  })
  it('higher dealer total wins', () => {
    const s = play('10S 10H 6D 9C', ['stand'])
    expect(s.seats[0].hands[0].outcome).toBe('lose')
    expect(s.seats[0].stack).toBe(990)
  })
})

describe('double down', () => {
  it('doubles the bet and deals exactly one card', () => {
    const s = play('6S 6H 5D 10C 10S 9H', ['double'])
    const h = s.seats[0].hands[0]
    expect(h.cards).toHaveLength(3)
    expect(h.bet).toBe(20)
    expect(h.outcome).toBe('win') // 21 vs dealer 16 → draws 9 → bust... dealer 6,10 =16 then 9 → 25 bust
    expect(s.seats[0].stack).toBe(1020)
  })
  it('is unavailable after hitting', () => {
    let s = startRound(table('2S 6H 3D 10C 2C'), { 0: 10 })
    s = act(s, 'hit')
    expect(availableActions(s)).not.toContain('double')
  })
  it('respects 10-11 only restriction', () => {
    const s = startRound(table('5S 6H 4D 10C', { doubleOn: '10-11' }), { 0: 10 })
    expect(availableActions(s)).not.toContain('double') // 9
    const t = startRound(table('5S 6H 5D 10C', { doubleOn: '10-11' }), { 0: 10 })
    expect(availableActions(t)).toContain('double') // 10
  })
  it('requires enough chips', () => {
    const s = startRound(table('5S 6H 5D 10C', {}, 15), { 0: 10 })
    expect(availableActions(s)).not.toContain('double')
  })
  it('throws on illegal actions', () => {
    const s = startRound(table('10S 6H 9D 10C'), { 0: 10 })
    expect(() => act(s, 'split')).toThrow(GameError)
  })
})

describe('splitting', () => {
  it('splits a pair into two hands, each played in turn, with the extra bet', () => {
    // P 8, D 10, P 8, D 7 (dealer 17); first hand gets 3 → 11, doubles onto a K → 21; second hand gets 10 → 18, stand
    let s = startRound(table('8S 10H 8D 7C 3S KD 10C'), { 0: 10 })
    expect(availableActions(s)).toContain('split')
    s = act(s, 'split')
    expect(s.seats[0].hands).toHaveLength(2)
    expect(s.seats[0].stack).toBe(980)
    expect(s.seats[0].hands[0].cards.map((c) => c.rank)).toEqual(['8', '3'])
    expect(availableActions(s)).toContain('double') // DAS
    s = act(s, 'double')
    expect(s.seats[0].activeHand).toBe(1)
    expect(s.seats[0].hands[1].cards.map((c) => c.rank)).toEqual(['8', '10'])
    s = act(s, 'stand')
    expect(s.phase).toBe('settled')
    expect(s.seats[0].hands.map((h) => h.outcome)).toEqual(['win', 'win'])
    expect(seatNet(s.seats[0])).toBe(30)
  })
  it('no double after split when DAS is off', () => {
    let s = startRound(table('8S 10H 8D 7C 3S KD', { doubleAfterSplit: false }), { 0: 10 })
    s = act(s, 'split')
    expect(availableActions(s)).not.toContain('double')
  })
  it('split aces get one card each and 21 is not blackjack', () => {
    let s = startRound(table('AS 9H AD 8C KS 7D'), { 0: 10 })
    s = act(s, 'split')
    expect(s.phase).toBe('settled')
    const [h1, h2] = s.seats[0].hands
    expect(h1.cards).toHaveLength(2)
    expect(h2.cards).toHaveLength(2)
    expect(h1.outcome).toBe('win') // 21 vs 17, paid 1:1
    expect(h1.net).toBe(10)
    expect(h2.outcome).toBe('win') // 18 vs 17
  })
  it('resplitting obeys the maximum hand count', () => {
    let s = startRound(table('8S 10H 8D 9C 8H 8C 8S 2D 2H 2S', { maxSplitHands: 3 }), { 0: 10 })
    s = act(s, 'split') // hands: [8,8] , [8]
    expect(s.seats[0].hands[0].cards.map((c) => c.rank)).toEqual(['8', '8'])
    expect(availableActions(s)).toContain('split')
    s = act(s, 'split') // 3 hands now
    expect(s.seats[0].hands).toHaveLength(3)
    expect(s.seats[0].hands[0].cards.map((c) => c.rank)).toEqual(['8', '8'])
    expect(availableActions(s)).not.toContain('split')
  })
  it('no resplit when max is 2 hands', () => {
    let s = startRound(table('8S 10H 8D 9C 8H', { maxSplitHands: 2 }), { 0: 10 })
    s = act(s, 'split')
    expect(availableActions(s)).not.toContain('split')
  })
  it('aces can be resplit only when allowed', () => {
    let s = startRound(table('AS 9H AD 8C AH 5D 6D 7D', { resplitAces: true }), { 0: 10 })
    s = act(s, 'split')
    expect(availableActions(s)).toEqual(['stand', 'split'])
    let t = startRound(table('AS 9H AD 8C AH 5D 6D 7D', { resplitAces: false }), { 0: 10 })
    t = act(t, 'split')
    expect(t.phase).toBe('settled')
  })
  it('requires chips for the second bet', () => {
    const s = startRound(table('8S 10H 8D 7C', {}, 15), { 0: 10 })
    expect(availableActions(s)).not.toContain('split')
  })
})

describe('surrender', () => {
  it('late surrender returns half the bet', () => {
    const s = play('10S 10H 6D 7C', ['surrender'])
    expect(s.seats[0].hands[0].outcome).toBe('surrender')
    expect(s.seats[0].hands[0].net).toBe(-5)
    expect(s.seats[0].stack).toBe(995)
  })
  it('not offered when the rule is off, after hitting, or after splitting', () => {
    expect(availableActions(startRound(table('10S 10H 6D 7C', { lateSurrender: false }), { 0: 10 }))).not.toContain('surrender')
    let s = startRound(table('2S 10H 3D 7C 4S'), { 0: 10 })
    s = act(s, 'hit')
    expect(availableActions(s)).not.toContain('surrender')
    let t = startRound(table('8S 10H 8D 7C 3S'), { 0: 10 })
    t = act(t, 'split')
    expect(availableActions(t)).not.toContain('surrender')
  })
  it('late surrender is impossible against a dealer blackjack (peek happens first)', () => {
    const s = startRound(table('10S KH 6D AC'), { 0: 10 })
    expect(s.phase).toBe('settled')
    expect(s.seats[0].hands[0].outcome).toBe('dealer-blackjack')
    expect(s.seats[0].stack).toBe(990)
  })
})

describe('insurance and even money', () => {
  it('offers insurance on an Ace', () => {
    const s = startRound(table('10S AH 9D KC'), { 0: 10 })
    expect(s.phase).toBe('insurance')
    expect(availableActions(s)).toEqual([])
  })
  it('insurance pays 2:1 when the dealer has blackjack (net zero overall)', () => {
    const s = play('10S AH 9D KC', ['ins'])
    expect(s.phase).toBe('settled')
    expect(s.seats[0].insuranceNet).toBe(10)
    expect(s.seats[0].hands[0].net).toBe(-10)
    expect(s.seats[0].stack).toBe(1000)
  })
  it('insurance loses when the dealer has no blackjack, then play continues', () => {
    let s = play('10S AH 9D 7C', ['ins'])
    expect(s.phase).toBe('playing')
    expect(s.seats[0].stack).toBe(985)
    s = act(s, 'stand')
    expect(s.seats[0].insuranceNet).toBe(-5)
    expect(s.seats[0].hands[0].outcome).toBe('win') // 19 vs 18
    expect(s.seats[0].stack).toBe(1005)
  })
  it('declining insurance against a dealer blackjack loses the bet', () => {
    const s = play('10S AH 9D KC', ['noins'])
    expect(s.seats[0].stack).toBe(990)
  })
  it('even money pays 1:1 immediately on a natural', () => {
    const s = play('AS AH KD KC', ['ins'])
    expect(s.seats[0].hands[0].outcome).toBe('even-money')
    expect(s.seats[0].stack).toBe(1010)
    const t = play('AS AH KD 7C', ['ins'])
    expect(t.seats[0].stack).toBe(1010)
  })
  it('declining even money: 3:2 if dealer lacks blackjack, push if it has one', () => {
    expect(play('AS AH KD 7C', ['noins']).seats[0].stack).toBe(1015)
    expect(play('AS AH KD KC', ['noins']).seats[0].stack).toBe(1000)
  })
  it('records insurance decisions; even money is right only at 6:5', () => {
    const s = play('10S AH 9D 7C', ['ins'])
    expect(s.decisions[0]).toMatchObject({ kind: 'insurance', action: 'insurance', correct: false })
    expect(evenMoneyIsCorrect(R)).toBe(false)
    expect(evenMoneyIsCorrect({ ...R, blackjackPayout: '6:5' })).toBe(true)
    const t = play('AS AH KD 7C', ['ins'], { blackjackPayout: '6:5' })
    expect(t.decisions[0]).toMatchObject({ action: 'even-money', correct: true })
  })
  it('dealer peeks with a ten up: no insurance, hand ends on blackjack', () => {
    const s = startRound(table('10S KH 9D AC'), { 0: 10 })
    expect(s.phase).toBe('settled')
    expect(s.dealerBlackjack).toBe(true)
  })
})

describe('bets, rounds and multiple hands', () => {
  it('enforces table minimum and maximum', () => {
    expect(() => startRound(table('10S 6H 9D 10C', { minBet: 25 }), { 0: 10 })).toThrow(/minimum/)
    expect(() => startRound(table('10S 6H 9D 10C', { maxBet: 100 }), { 0: 200 })).toThrow(/maximum/)
    expect(() => startRound(table('10S 6H 9D 10C', {}, 5), { 0: 10 })).toThrow(/Not enough/)
  })
  it('deals two spots in order and plays them left to right', () => {
    // seat0 c1, seat1 c1, dealer up, seat0 c2, seat1 c2, hole
    let s = startRound(table('10S 9S 6H 8D 9D 10C', {}, 1000, 1), { 0: 10, 1: 10 })
    expect(s.seats[0].hands[0].cards.map((c) => c.rank)).toEqual(['10', '8'])
    expect(s.seats[1].hands[0].cards.map((c) => c.rank)).toEqual(['9', '9'])
    expect(s.activeSeat).toBe(0)
    s = act(s, 'stand')
    expect(s.activeSeat).toBe(1)
    s = act(s, 'stand')
    expect(s.phase).toBe('settled')
  })
  it('NPC seats play automatically', () => {
    const g = createGame(R, [{ name: 'You', human: true, stack: 500 }, { name: 'Vic', human: false, stack: 500 }], 1, stackedShoe('10S 10D 7H 9S 8D KC 5S 5D 5H'))
    let s = startRound(g, { 0: 10, 1: 10 })
    expect(s.activeSeat).toBe(0)
    s = act(s, 'stand')
    expect(s.phase).toBe('settled')
    expect(s.seats[1].hands[0].cards.length).toBeGreaterThanOrEqual(2)
  })
  it('can start the next round after settlement and reshuffles at the cut card', () => {
    const g = createGame({ ...R, decks: 1, penetration: 0.5 }, [{ name: 'You', human: true, stack: 10000 }], 5)
    let s = g
    let shuffles = 0
    for (let i = 0; i < 40; i++) {
      s = startRound(s, { 0: 10 })
      if (s.events.some((e) => e.t === 'shuffle')) shuffles++
      while (s.phase === 'insurance') s = insuranceDecision(s, 0, false)
      while (s.phase === 'playing') s = act(s, 'stand')
      expect(s.phase).toBe('settled')
    }
    expect(shuffles).toBeGreaterThan(3)
  })
  it('chips are conserved: stack change equals the sum of nets', () => {
    let s = createGame(R, [{ name: 'You', human: true, stack: 100000 }], 77)
    for (let i = 0; i < 400; i++) {
      const before = s.seats[0].stack
      s = startRound(s, { 0: 10 })
      while (s.phase === 'insurance') s = insuranceDecision(s, 0, i % 3 === 0)
      while (s.phase === 'playing') {
        const acts = availableActions(s)
        s = act(s, acts[(i * 7 + s.seats[0].hands.length) % acts.length])
      }
      expect(s.seats[0].stack - before).toBeCloseTo(seatNet(s.seats[0]), 6)
    }
  })
  it('hides the hole card from the count until revealed', () => {
    const s = startRound(table('10S 6H 9D 5C 10H'), { 0: 10 })
    expect(seenCards(s).map((c) => c.rank)).toEqual(['10', '6', '9'])
    const t = act(s, 'stand')
    expect(seenCards(t).map((c) => c.rank)).toEqual(['10', '6', '9', '5', '10'])
  })
  it('records decisions with correctness independent of results', () => {
    // 16 vs 10, standing is wrong; dealer busts and the player wins anyway
    const s = play('10S 10H 6D 6C 10D', ['stand'], { lateSurrender: false })
    expect(s.seats[0].hands[0].outcome).toBe('win')
    expect(s.decisions[0]).toMatchObject({ action: 'stand', recommended: 'hit', correct: false })
  })
})

describe('one player, several spots', () => {
  it('spots share one wallet', () => {
    const g = createGame(R, [{ name: 'You', human: true, stack: 100 }, { name: 'You (2)', human: true, stack: 0, wallet: 0 }], 1, stackedShoe('10S 9S 6H 8D 9D 10C'))
    let s = startRound(g, { 0: 40, 1: 40 })
    expect(s.seats[0].stack).toBe(20)
    expect(availableActions(s)).not.toContain('double') // only 20 left
    s = act(s, 'stand')
    s = act(s, 'stand')
    // 18 vs 16→ dealer draws... stacked shoe exhausted, fresh shoe; just check conservation
    expect(s.seats[0].stack + s.seats[1].stack).toBe(100 + seatNet(s.seats[0]) + seatNet(s.seats[1]))
    expect(s.seats[1].stack).toBe(0)
  })
  it('cannot over-bet a shared wallet', () => {
    const g = createGame(R, [{ name: 'You', human: true, stack: 50 }, { name: 'You (2)', human: true, stack: 0, wallet: 0 }], 1, stackedShoe('10S 9S 6H 8D 9D 10C'))
    expect(() => startRound(g, { 0: 40, 1: 40 })).toThrow(/Not enough/)
  })
})
