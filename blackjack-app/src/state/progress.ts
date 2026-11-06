// Player progress: pure functions over a plain JSON object, so it can be stored
// locally or synced, and unit tested. XP rewards learning only: correct decisions,
// lessons, drills and streaks. Nothing here ever looks at chips won or bet sizes.
import { DEFAULT_RULES, type TableRules } from '../engine/rules'
import type { Action, HandKind } from '../engine/strategy'

export type DecisionType = Action | 'insurance'
export type Source = 'table' | 'teacher' | 'challenge' | 'rapid' | 'weakness' | 'daily' | 'lesson'

export interface Tally { total: number; correct: number }
export interface DayStat { date: string; decisions: number; correct: number; xp: number; hands: number }
export interface Mistake { at: number; cell: string; chose: string; should: string; source: Source }
export type Venue = 'practice' | 'atlantic-city' | 'online'

export interface Settings {
  rules: TableRules
  presetId: string
  venue: Venue
  showCount: boolean
  dealerSpeed: 'relaxed' | 'normal' | 'fast'
  autoTeach: boolean
  reduceMotion: boolean
  /** Seat computer players at the table. Off: it's just you and the dealer. */
  otherPlayers: boolean
}

export interface Progress {
  version: 1
  name: string
  createdAt: number
  updatedAt: number
  xp: number
  lessons: Record<string, { completedAt: number; score: number }>
  unlockedLevels: number[]
  decisions: {
    total: number
    correct: number
    streak: number
    bestStreak: number
    byAction: Record<DecisionType, Tally>
    byKind: Record<HandKind, Tally>
    byCell: Record<string, Tally>
  }
  insurance: { offered: number; declined: number }
  hands: { played: number; won: number; lost: number; pushed: number; blackjacks: number; correctLosses: number; mistakeWins: number }
  chips: { bankroll: number; resets: number }
  history: DayStat[]
  mistakes: Mistake[]
  rapid: { runs: number; bestCorrect: number; bestAvgMs: number | null; lastAccuracy: number | null }
  counting: { rcAttempts: number; rcCorrect: number; tcAttempts: number; tcCorrect: number; bestDeckMs: number | null; decksCounted: number }
  signals: { attempts: number; correct: number }
  daily: Record<string, { score: number; completedAt: number }>
  streak: { current: number; best: number; lastDay: string | null }
  achievements: Record<string, number>
  weaknessSessions: { runs: number; bestAccuracy: number }
  settings: Settings
}

export const STARTING_BANKROLL = 1000

export function blankProgress(now = Date.now()): Progress {
  const tally = (): Tally => ({ total: 0, correct: 0 })
  return {
    version: 1,
    name: '',
    createdAt: now,
    updatedAt: now,
    xp: 0,
    lessons: {},
    unlockedLevels: [1, 2],
    decisions: {
      total: 0, correct: 0, streak: 0, bestStreak: 0,
      byAction: { hit: tally(), stand: tally(), double: tally(), split: tally(), surrender: tally(), insurance: tally() },
      byKind: { hard: tally(), soft: tally(), pair: tally() },
      byCell: {},
    },
    insurance: { offered: 0, declined: 0 },
    hands: { played: 0, won: 0, lost: 0, pushed: 0, blackjacks: 0, correctLosses: 0, mistakeWins: 0 },
    chips: { bankroll: STARTING_BANKROLL, resets: 0 },
    history: [],
    mistakes: [],
    rapid: { runs: 0, bestCorrect: 0, bestAvgMs: null, lastAccuracy: null },
    counting: { rcAttempts: 0, rcCorrect: 0, tcAttempts: 0, tcCorrect: 0, bestDeckMs: null, decksCounted: 0 },
    signals: { attempts: 0, correct: 0 },
    daily: {},
    streak: { current: 0, best: 0, lastDay: null },
    achievements: {},
    weaknessSessions: { runs: 0, bestAccuracy: 0 },
    settings: {
      rules: { ...DEFAULT_RULES },
      presetId: 'atlantic-city',
      venue: 'practice',
      showCount: false,
      dealerSpeed: 'normal',
      autoTeach: true,
      reduceMotion: false,
      otherPlayers: false,
    },
  }
}

/** Fill any fields missing from older saves without losing data. */
export function migrate(raw: unknown): Progress {
  const base = blankProgress()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<Progress>
  const merged: Progress = {
    ...base,
    ...r,
    decisions: {
      ...base.decisions, ...(r.decisions ?? {}),
      byAction: { ...base.decisions.byAction, ...(r.decisions?.byAction ?? {}) },
      byKind: { ...base.decisions.byKind, ...(r.decisions?.byKind ?? {}) },
      byCell: { ...(r.decisions?.byCell ?? {}) },
    },
    insurance: { ...base.insurance, ...(r.insurance ?? {}) },
    hands: { ...base.hands, ...(r.hands ?? {}) },
    chips: { ...base.chips, ...(r.chips ?? {}) },
    rapid: { ...base.rapid, ...(r.rapid ?? {}) },
    counting: { ...base.counting, ...(r.counting ?? {}) },
    signals: { ...base.signals, ...(r.signals ?? {}) },
    streak: { ...base.streak, ...(r.streak ?? {}) },
    weaknessSessions: { ...base.weaknessSessions, ...(r.weaknessSessions ?? {}) },
    settings: { ...base.settings, ...(r.settings ?? {}), rules: { ...base.settings.rules, ...(r.settings?.rules ?? {}) } },
    version: 1,
  }
  if (!Array.isArray(merged.history)) merged.history = []
  if (!Array.isArray(merged.mistakes)) merged.mistakes = []
  if (!Array.isArray(merged.unlockedLevels)) merged.unlockedLevels = [1, 2]
  return merged
}

// ── Levels and ranks ────────────────────────────────────────────────────────

/** Cumulative XP needed to reach a level: 0, 250, 750, 1500, 2500, … */
export function xpForLevel(level: number): number {
  return 125 * (level - 1) * level
}

export function levelFor(xp: number): { level: number; into: number; needed: number; progress: number } {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  const into = xp - xpForLevel(level)
  const needed = xpForLevel(level + 1) - xpForLevel(level)
  return { level, into, needed, progress: into / needed }
}

export const RANKS: { min: number; title: string; blurb: string }[] = [
  { min: 1, title: 'Railbird', blurb: 'Watching from behind the rail, learning the game.' },
  { min: 3, title: 'Rookie', blurb: 'You know the rules and you’ve taken a seat.' },
  { min: 5, title: 'Table Regular', blurb: 'Comfortable at the table and its customs.' },
  { min: 8, title: 'Strategist', blurb: 'Your decisions come from the chart, not your gut.' },
  { min: 11, title: 'Card Sharp', blurb: 'Basic strategy is second nature.' },
  { min: 15, title: 'Advantage Student', blurb: 'Counting, true counts and deviations.' },
  { min: 20, title: 'Table Master', blurb: 'You own the table: the math, the etiquette, the discipline.' },
]

export function rankFor(level: number) {
  let r = RANKS[0]
  for (const x of RANKS) if (level >= x.min) r = x
  return r
}

// ── Dates and streaks ───────────────────────────────────────────────────────

export function dayKey(t = Date.now()): string {
  const d = new Date(t)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function daysBetween(a: string, b: string): number {
  const pa = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))
  const pb = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10))
  return Math.round((pb - pa) / 86400000)
}

/** Current streak, accounting for a missed day (a streak shows 0 once a day is skipped). */
export function liveStreak(p: Progress, today = dayKey()): number {
  if (!p.streak.lastDay) return 0
  const gap = daysBetween(p.streak.lastDay, today)
  return gap <= 1 ? p.streak.current : 0
}

// ── Events ──────────────────────────────────────────────────────────────────

export type Notice = { kind: 'xp'; amount: number; reason: string } | { kind: 'level'; level: number; rank: string } | { kind: 'achievement'; id: string }

export interface Ctx {
  now: number
  notices: Notice[]
}

function touchDay(p: Progress, c: Ctx): DayStat {
  const key = dayKey(c.now)
  if (p.streak.lastDay !== key) {
    const gap = p.streak.lastDay ? daysBetween(p.streak.lastDay, key) : Infinity
    p.streak.current = gap === 1 ? p.streak.current + 1 : 1
    p.streak.best = Math.max(p.streak.best, p.streak.current)
    p.streak.lastDay = key
    const bonus = Math.min(7, p.streak.current) * 10
    addXp(p, c, bonus, `Day ${p.streak.current} training streak`)
  }
  let d = p.history.find((h) => h.date === key)
  if (!d) {
    d = { date: key, decisions: 0, correct: 0, xp: 0, hands: 0 }
    p.history.push(d)
    p.history.sort((a, b) => a.date.localeCompare(b.date))
    if (p.history.length > 120) p.history.splice(0, p.history.length - 120)
  }
  return d
}

export function addXp(p: Progress, c: Ctx, amount: number, reason: string) {
  if (amount <= 0) return
  const before = levelFor(p.xp).level
  p.xp += amount
  const day = p.history.find((h) => h.date === dayKey(c.now))
  if (day) day.xp += amount
  c.notices.push({ kind: 'xp', amount, reason })
  const after = levelFor(p.xp).level
  if (after > before) c.notices.push({ kind: 'level', level: after, rank: rankFor(after).title })
}

export interface DecisionInput {
  type: DecisionType
  /** The recommended action, or 'insurance' for insurance decisions. */
  recommended: DecisionType
  correct: boolean
  cell?: string
  kind?: HandKind
  chose: string
  source: Source
}

export const XP = {
  correctDecision: 10,
  rapidCorrect: 5,
  lessonComplete: 100,
  lessonPerfect: 50,
  dailyComplete: 150,
  dailyPerfect: 100,
  countCorrect: 15,
  signalCorrect: 10,
  weaknessSession: 60,
}

export function recordDecision(p: Progress, c: Ctx, d: DecisionInput) {
  const day = touchDay(p, c)
  const dec = p.decisions
  dec.total++
  day.decisions++
  const tally = dec.byAction[d.recommended] ?? (dec.byAction[d.recommended] = { total: 0, correct: 0 })
  tally.total++
  if (d.kind) dec.byKind[d.kind].total++
  if (d.cell) {
    const t = dec.byCell[d.cell] ?? (dec.byCell[d.cell] = { total: 0, correct: 0 })
    t.total++
    if (d.correct) t.correct++
  }
  if (d.type === 'insurance' || d.recommended === 'insurance') {
    p.insurance.offered++
    if (d.chose === 'no-insurance' || d.chose === 'no-even-money') p.insurance.declined++
  }
  if (d.correct) {
    dec.correct++
    day.correct++
    tally.correct++
    if (d.kind) dec.byKind[d.kind].correct++
    dec.streak++
    dec.bestStreak = Math.max(dec.bestStreak, dec.streak)
    addXp(p, c, d.source === 'rapid' ? XP.rapidCorrect : XP.correctDecision, 'Correct decision')
  } else {
    dec.streak = 0
    p.mistakes.unshift({ at: c.now, cell: d.cell ?? 'insurance', chose: d.chose, should: String(d.recommended), source: d.source })
    if (p.mistakes.length > 60) p.mistakes.length = 60
  }
  checkAchievements(p, c)
}

export interface HandResultInput {
  net: number
  blackjack: boolean
  /** null when the hand had no decisions. */
  allCorrect: boolean | null
}

/** Outcomes are tracked separately from decision quality and never award XP. */
export function recordHand(p: Progress, c: Ctx, h: HandResultInput) {
  const day = touchDay(p, c)
  day.hands++
  p.hands.played++
  if (h.net > 0) p.hands.won++
  else if (h.net < 0) p.hands.lost++
  else p.hands.pushed++
  if (h.blackjack) p.hands.blackjacks++
  if (h.allCorrect === true && h.net < 0) p.hands.correctLosses++
  if (h.allCorrect === false && h.net > 0) p.hands.mistakeWins++
  checkAchievements(p, c)
}

export function setBankroll(p: Progress, amount: number) {
  p.chips.bankroll = Math.max(0, Math.round(amount * 100) / 100)
}

export function resetBankroll(p: Progress) {
  p.chips.bankroll = STARTING_BANKROLL
  p.chips.resets++
}

export function completeLesson(p: Progress, c: Ctx, lessonId: string, score: number, levelLessons: string[], level: number) {
  touchDay(p, c)
  const first = !p.lessons[lessonId]
  const prev = p.lessons[lessonId]?.score ?? 0
  p.lessons[lessonId] = { completedAt: c.now, score: Math.max(prev, score) }
  if (first) addXp(p, c, XP.lessonComplete, 'Lesson complete')
  if (score >= 1 && prev < 1) addXp(p, c, XP.lessonPerfect, 'Perfect lesson quiz')
  if (levelLessons.every((id) => p.lessons[id]) && !p.unlockedLevels.includes(level + 1)) p.unlockedLevels.push(level + 1)
  checkAchievements(p, c)
}

export function unlockLevel(p: Progress, level: number) {
  if (!p.unlockedLevels.includes(level)) p.unlockedLevels.push(level)
}

export function recordRapid(p: Progress, c: Ctx, correct: number, total: number, avgMs: number) {
  touchDay(p, c)
  p.rapid.runs++
  p.rapid.bestCorrect = Math.max(p.rapid.bestCorrect, correct)
  if (total >= 10 && correct / total >= 0.8) p.rapid.bestAvgMs = p.rapid.bestAvgMs == null ? avgMs : Math.min(p.rapid.bestAvgMs, avgMs)
  p.rapid.lastAccuracy = total ? correct / total : null
  if (total >= 20 && correct === total) unlock(p, c, 'rapid-perfect')
  checkAchievements(p, c)
}

export function recordDaily(p: Progress, c: Ctx, date: string, score: number) {
  touchDay(p, c)
  if (p.daily[date]) {
    p.daily[date].score = Math.max(p.daily[date].score, score)
    return
  }
  p.daily[date] = { score, completedAt: c.now }
  addXp(p, c, XP.dailyComplete, 'Daily challenge')
  if (score === 10) addXp(p, c, XP.dailyPerfect, 'Perfect daily challenge')
  checkAchievements(p, c)
}

export function recordCount(p: Progress, c: Ctx, type: 'rc' | 'tc', correct: boolean, deckMs?: number) {
  touchDay(p, c)
  if (type === 'rc') {
    p.counting.rcAttempts++
    if (correct) p.counting.rcCorrect++
    if (correct && deckMs != null) {
      p.counting.decksCounted++
      p.counting.bestDeckMs = p.counting.bestDeckMs == null ? deckMs : Math.min(p.counting.bestDeckMs, deckMs)
    }
  } else {
    p.counting.tcAttempts++
    if (correct) p.counting.tcCorrect++
  }
  if (correct) addXp(p, c, XP.countCorrect, type === 'rc' ? 'Running count correct' : 'True count correct')
  checkAchievements(p, c)
}

export function recordSignal(p: Progress, c: Ctx, correct: boolean) {
  touchDay(p, c)
  p.signals.attempts++
  if (correct) {
    p.signals.correct++
    addXp(p, c, XP.signalCorrect, 'Correct hand signal')
  }
  checkAchievements(p, c)
}

export function recordWeaknessSession(p: Progress, c: Ctx, accuracy: number, n: number) {
  touchDay(p, c)
  if (n < 10) return
  p.weaknessSessions.runs++
  p.weaknessSessions.bestAccuracy = Math.max(p.weaknessSessions.bestAccuracy, accuracy)
  addXp(p, c, XP.weaknessSession, 'Weakness training session')
  checkAchievements(p, c)
}

// ── Achievements ────────────────────────────────────────────────────────────

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  test?: (p: Progress) => boolean
}

const acc = (t: Tally) => (t.total ? t.correct / t.total : 0)

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'Pulled Up a Chair', description: 'Complete your first lesson.', icon: 'book', test: (p) => Object.keys(p.lessons).length >= 1 },
  { id: 'first-hand', title: 'First Hand', description: 'Play a hand at the table.', icon: 'cards', test: (p) => p.hands.played >= 1 },
  { id: 'textbook-10', title: 'Textbook', description: '10 correct decisions in a row.', icon: 'check', test: (p) => p.decisions.bestStreak >= 10 },
  { id: 'textbook-50', title: 'Ice in the Veins', description: '50 correct decisions in a row.', icon: 'flame', test: (p) => p.decisions.bestStreak >= 50 },
  { id: 'good-decision', title: 'Bad Luck, Good Decision', description: 'Lose 5 hands where every decision was correct. Results aren’t the scoreboard.', icon: 'shield', test: (p) => p.hands.correctLosses >= 5 },
  { id: 'no-thanks', title: 'No Thanks, Dealer', description: 'Turn down insurance 10 times.', icon: 'hand', test: (p) => p.insurance.declined >= 10 },
  { id: 'doubler', title: 'Pressing the Edge', description: 'Make 10 correct double downs.', icon: 'double', test: (p) => p.decisions.byAction.double.correct >= 10 },
  { id: 'splitter', title: 'Split Decision', description: 'Make 10 correct splits.', icon: 'split', test: (p) => p.decisions.byAction.split.correct >= 10 },
  { id: 'surrender', title: 'Live to Fight', description: 'Make 5 correct surrenders.', icon: 'flag', test: (p) => p.decisions.byAction.surrender.correct >= 5 },
  { id: 'sharp-90', title: 'Sharp', description: '90% basic strategy accuracy over at least 100 decisions.', icon: 'target', test: (p) => p.decisions.total >= 100 && acc(p.decisions) >= 0.9 },
  { id: 'sharp-97', title: 'Machine', description: '97% accuracy over at least 300 decisions.', icon: 'gem', test: (p) => p.decisions.total >= 300 && acc(p.decisions) >= 0.97 },
  { id: 'streak-3', title: 'Habit Forming', description: 'Train 3 days in a row.', icon: 'calendar', test: (p) => p.streak.best >= 3 },
  { id: 'streak-7', title: 'Full Week', description: 'Train 7 days in a row.', icon: 'calendar', test: (p) => p.streak.best >= 7 },
  { id: 'streak-30', title: 'Regular', description: 'Train 30 days in a row.', icon: 'crown', test: (p) => p.streak.best >= 30 },
  { id: 'signals-20', title: 'Signal Caller', description: 'Give 20 correct hand signals.', icon: 'hand', test: (p) => p.signals.correct >= 20 },
  { id: 'counter', title: 'Through the Deck', description: 'Count down a full deck correctly.', icon: 'eye', test: (p) => p.counting.decksCounted >= 1 },
  { id: 'true-count', title: 'True Believer', description: '10 correct true count conversions.', icon: 'divide', test: (p) => p.counting.tcCorrect >= 10 },
  { id: 'rapid-perfect', title: 'Lightning Round', description: 'Rapid-fire: 20 for 20.', icon: 'bolt' },
  { id: 'daily-5', title: 'Daily Grinder', description: 'Complete 5 daily challenges.', icon: 'sun', test: (p) => Object.keys(p.daily).length >= 5 },
  { id: 'weakness', title: 'Weak Spots, Fixed', description: 'Score 80%+ in a weakness training session.', icon: 'wrench', test: (p) => p.weaknessSessions.bestAccuracy >= 0.8 },
  { id: 'level-1', title: 'Fundamentals', description: 'Complete Level 1: Blackjack Fundamentals.', icon: 'medal' },
  { id: 'level-2', title: 'Table Manners', description: 'Complete Level 2: Casino Etiquette.', icon: 'medal' },
  { id: 'level-3', title: 'Decision Maker', description: 'Complete Level 3: Player Decisions.', icon: 'medal' },
  { id: 'level-4', title: 'Side Bet Skeptic', description: 'Complete Level 4: Insurance and Side Bets.', icon: 'medal' },
  { id: 'level-5', title: 'By the Book', description: 'Complete Level 5: Basic Strategy Mastery.', icon: 'medal' },
  { id: 'level-6', title: 'Numbers Person', description: 'Complete Level 6: Blackjack Mathematics.', icon: 'medal' },
  { id: 'level-7', title: 'Counting Room', description: 'Complete Level 7: Advanced Strategy and Counting.', icon: 'medal' },
]

/** Set by the lesson module so level achievements know which lessons belong to each level. */
let levelLessonIds: Record<number, string[]> = {}
export function registerLevels(map: Record<number, string[]>) {
  levelLessonIds = map
}

export function unlock(p: Progress, c: Ctx, id: string) {
  if (p.achievements[id]) return
  p.achievements[id] = c.now
  c.notices.push({ kind: 'achievement', id })
}

export function checkAchievements(p: Progress, c: Ctx) {
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue
    if (a.test?.(p)) unlock(p, c, a.id)
  }
  for (const [lvl, ids] of Object.entries(levelLessonIds)) {
    if (ids.length && ids.every((id) => p.lessons[id])) unlock(p, c, `level-${lvl}`)
  }
}

export function accuracy(t: Tally): number | null {
  return t.total ? t.correct / t.total : null
}

export function topMistakes(p: Progress, n = 6): { cell: string; wrong: number; total: number }[] {
  return Object.entries(p.decisions.byCell)
    .map(([cell, t]) => ({ cell, wrong: t.total - t.correct, total: t.total }))
    .filter((x) => x.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || b.total - a.total)
    .slice(0, n)
}
