import { describe, expect, it } from 'vitest'
import { createRng } from '../rng'
import { DEFAULT_RULES } from '../rules'
import { cellsFor, dailySituations, nextSituation, situationFromCell, weaknessWeights } from '../drills'
import { handValue, isPair } from '../hand'

describe('drills', () => {
  it('generated hands match the requested cell', () => {
    const rng = createRng(3)
    for (const cell of cellsFor('all', DEFAULT_RULES)) {
      const s = situationFromCell(cell, DEFAULT_RULES, rng)
      const v = handValue(s.cards)
      if (cell.kind === 'pair') expect(isPair(s.cards)).toBe(true)
      else if (cell.kind === 'soft') expect(v).toMatchObject({ soft: true, total: cell.rowKey })
      else {
        expect(v.soft).toBe(false)
        expect(v.total).toBe(cell.rowKey)
      }
      expect(s.rec.cell).toBeTruthy()
    }
  })
  it('categories filter cells', () => {
    expect(cellsFor('soft', DEFAULT_RULES).every((c) => c.kind === 'soft')).toBe(true)
    expect(cellsFor('pair', DEFAULT_RULES)).toHaveLength(100)
    expect(cellsFor('surrender', DEFAULT_RULES).every((c) => c.up >= 9)).toBe(true)
  })
  it('weakness weighting targets missed cells', () => {
    const w = weaknessWeights({ hard16v10: { total: 4, correct: 1 }, soft18v9: { total: 5, correct: 5 } })
    expect(w.hard16v10).toBeGreaterThan(20)
    expect(w.soft18v9).toBeUndefined()
    const rng = createRng(1)
    let hits = 0
    for (let i = 0; i < 300; i++) if (nextSituation('all', DEFAULT_RULES, rng, { hard16v10: 400 }).rec.cell === 'hard16v10') hits++
    expect(hits).toBeGreaterThan(80)
  })
  it('daily challenge is the same for a date and different across dates', () => {
    const a = dailySituations('2026-11-05', DEFAULT_RULES, 11).map((s) => s.rec.cell)
    const b = dailySituations('2026-11-05', DEFAULT_RULES, 11).map((s) => s.rec.cell)
    const c = dailySituations('2026-11-06', DEFAULT_RULES, 12).map((s) => s.rec.cell)
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
    expect(a).toHaveLength(10)
  })
})
