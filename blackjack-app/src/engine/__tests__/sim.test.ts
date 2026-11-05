import { describe, expect, it } from 'vitest'
import { simulate, mean, stdev, riskOfRuin, sessions } from '../sim'
import { playerExpectation } from '../ev'
import { DEFAULT_RULES } from '../rules'

describe('simulator and house edge', () => {
  it('computed expectation is a small house edge for good rules, and 6:5 costs ~1.4%', () => {
    const good = playerExpectation({ ...DEFAULT_RULES, lateSurrender: false })
    expect(good).toBeLessThan(0)
    expect(good).toBeGreaterThan(-0.012)
    const bad = playerExpectation({ ...DEFAULT_RULES, lateSurrender: false, blackjackPayout: '6:5' })
    expect(good - bad).toBeGreaterThan(0.012)
    expect(good - bad).toBeLessThan(0.016)
  })
  it('H17 costs the player and surrender / DAS help', () => {
    const base = { ...DEFAULT_RULES, lateSurrender: false }
    expect(playerExpectation({ ...base, dealerHitsSoft17: true })).toBeLessThan(playerExpectation(base))
    expect(playerExpectation({ ...base, lateSurrender: true })).toBeGreaterThan(playerExpectation(base))
    expect(playerExpectation({ ...base, doubleAfterSplit: false })).toBeLessThan(playerExpectation(base))
  })
  it('simulated basic strategy lands near the computed edge with realistic spread', () => {
    const r = simulate(DEFAULT_RULES, 60000, 2024)
    expect(r.hands).toBe(60000)
    expect(Math.abs(mean(r.nets))).toBeLessThan(0.03)
    expect(stdev(r.nets)).toBeGreaterThan(1.05)
    expect(stdev(r.nets)).toBeLessThan(1.25)
    expect(r.blackjacks / r.hands).toBeGreaterThan(0.04)
    expect(r.blackjacks / r.hands).toBeLessThan(0.055)
    expect(r.wins).toBeLessThan(r.losses) // players lose more hands than they win
  })
  it('session and ruin helpers', () => {
    expect(sessions([1, -1, 1, 1, -1, 0], 2)).toEqual([0, 2, -1])
    expect(riskOfRuin([-1, -1, -1, 1, 1, 1], 2, 3)).toBe(0.5)
  })
})
