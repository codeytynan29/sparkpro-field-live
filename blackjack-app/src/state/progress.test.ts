import { describe, expect, it } from 'vitest'
import { blankProgress, completeLesson, levelFor, liveStreak, migrate, recordDecision, recordHand, recordDaily, xpForLevel, topMistakes, type Ctx } from './progress'

const ctx = (now = Date.UTC(2026, 10, 5, 15)): Ctx => ({ now, notices: [] })

describe('progress', () => {
  it('levels', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(250)
    expect(levelFor(0).level).toBe(1)
    expect(levelFor(260).level).toBe(2)
    expect(levelFor(750).level).toBe(3)
  })
  it('correct decisions earn XP, wrong ones record a mistake', () => {
    const p = blankProgress()
    const c = ctx()
    recordDecision(p, c, { type: 'stand', recommended: 'hit', correct: false, cell: 'hard16v10', kind: 'hard', chose: 'stand', source: 'challenge' })
    const xpAfterWrong = p.xp
    recordDecision(p, c, { type: 'hit', recommended: 'hit', correct: true, cell: 'hard16v10', kind: 'hard', chose: 'hit', source: 'challenge' })
    expect(p.xp - xpAfterWrong).toBe(10)
    expect(p.decisions.byAction.hit).toEqual({ total: 2, correct: 1 })
    expect(p.mistakes[0]).toMatchObject({ cell: 'hard16v10', chose: 'stand', should: 'hit' })
    expect(topMistakes(p)[0]).toMatchObject({ cell: 'hard16v10', wrong: 1 })
  })
  it('hand outcomes never award XP and are kept apart from decision quality', () => {
    const p = blankProgress()
    const c = ctx()
    recordHand(p, c, { net: 0, blackjack: false, allCorrect: null }) // first activity of day: streak bonus
    const xp = p.xp
    recordHand(p, c, { net: 500, blackjack: true, allCorrect: false })
    recordHand(p, c, { net: -10, blackjack: false, allCorrect: true })
    expect(p.xp).toBe(xp)
    expect(p.hands).toMatchObject({ played: 3, won: 1, lost: 1, mistakeWins: 1, correctLosses: 1 })
  })
  it('streaks count consecutive days and reset after a gap', () => {
    const p = blankProgress()
    const day = (d: number) => Date.UTC(2026, 10, d, 15)
    for (const d of [1, 2, 3]) recordHand(p, ctx(day(d)), { net: 0, blackjack: false, allCorrect: null })
    expect(p.streak.current).toBe(3)
    expect(liveStreak(p, '2026-11-04')).toBe(3)
    expect(liveStreak(p, '2026-11-06')).toBe(0)
    recordHand(p, ctx(day(6)), { net: 0, blackjack: false, allCorrect: null })
    expect(p.streak.current).toBe(1)
    expect(p.streak.best).toBe(3)
    expect(p.achievements['streak-3']).toBeTruthy()
  })
  it('lessons unlock the next level and give XP only once', () => {
    const p = blankProgress()
    const c = ctx()
    completeLesson(p, c, 'a', 1, ['a', 'b'], 2)
    expect(p.unlockedLevels).not.toContain(3)
    completeLesson(p, c, 'b', 0.5, ['a', 'b'], 2)
    expect(p.unlockedLevels).toContain(3)
    const xp = p.xp
    completeLesson(p, c, 'b', 0.5, ['a', 'b'], 2)
    expect(p.xp).toBe(xp)
  })
  it('daily challenge only pays once a day', () => {
    const p = blankProgress()
    const c = ctx()
    recordDaily(p, c, '2026-11-05', 10)
    const xp = p.xp
    recordDaily(p, c, '2026-11-05', 10)
    expect(p.xp).toBe(xp)
  })
  it('migrates partial or corrupt saves', () => {
    expect(migrate(null).version).toBe(1)
    const m = migrate({ xp: 500, decisions: { total: 3 } })
    expect(m.xp).toBe(500)
    expect(m.decisions.total).toBe(3)
    expect(m.decisions.byAction.hit.total).toBe(0)
    expect(m.settings.rules.decks).toBe(6)
  })
})
