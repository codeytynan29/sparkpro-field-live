import { registerLevels } from '../state/progress'
import { LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4 } from './levels1to4'
import { LEVEL_5, LEVEL_6, LEVEL_7 } from './levels5to7'
import type { Lesson, Level } from './types'

export const LEVELS: Level[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7]

registerLevels(Object.fromEntries(LEVELS.map((l) => [l.n, l.lessons.map((x) => x.id)])))

export function findLesson(id: string): { level: Level; lesson: Lesson; index: number } | null {
  for (const level of LEVELS) {
    const index = level.lessons.findIndex((l) => l.id === id)
    if (index >= 0) return { level, lesson: level.lessons[index], index }
  }
  return null
}

export function allLessons(): { level: Level; lesson: Lesson }[] {
  return LEVELS.flatMap((level) => level.lessons.map((lesson) => ({ level, lesson })))
}

/** The first lesson not yet completed in an unlocked level. */
export function nextLesson(completed: Record<string, unknown>, unlocked: number[]): { level: Level; lesson: Lesson } | null {
  for (const { level, lesson } of allLessons()) {
    if (!unlocked.includes(level.n)) continue
    if (!completed[lesson.id]) return { level, lesson }
  }
  return null
}

export type { Lesson, Level, Step } from './types'
