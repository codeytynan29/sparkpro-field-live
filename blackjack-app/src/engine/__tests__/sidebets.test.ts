import { describe, expect, it } from 'vitest'
import { perfectPairs, threeCardProbs, twentyOnePlusThree } from '../sidebets'

describe('side bets', () => {
  it('Perfect Pairs 25/12/6 with 6 decks has a ~6.1% house edge', () => {
    expect(perfectPairs(6).houseEdge).toBeCloseTo(0.0611, 3)
  })
  it('3-card probabilities sum to 1', () => {
    const p = threeCardProbs(6)
    expect(Object.values(p).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9)
  })
  it('single deck has no suited trips', () => {
    expect(threeCardProbs(1)['suited-trips']).toBe(0)
  })
  it('21+3 is a house-favored bet under both paytables', () => {
    for (const d of [1, 2, 6, 8]) {
      expect(twentyOnePlusThree(d, 'classic').houseEdge).toBeGreaterThan(0.01)
      expect(twentyOnePlusThree(d, 'modern').houseEdge).toBeGreaterThan(0.01)
    }
  })
})
