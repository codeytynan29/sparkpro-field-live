import type { TableRules } from '../engine/rules'

export type WidgetId =
  | 'card-values' | 'hand-builder' | 'total-quiz' | 'dealer-play' | 'bust-table' | 'player-bust'
  | 'table-layout' | 'chip-colors' | 'signals-demo' | 'signal-drill' | 'ev-compare' | 'insurance-math'
  | 'payout-calc' | 'house-edge' | 'variance-sim' | 'ruin-sim' | 'count-drill' | 'tc-drill'
  | 'deck-estimation' | 'strategy-chart' | 'perfect-pairs' | 'twenty-one-plus-three' | 'index-plays'
  | 'round-flow' | 'decision-drill' | 'removal-effects'

export type Step =
  | { type: 'text'; title?: string; body: string[]; cards?: string; dealerUp?: string; tip?: string }
  | { type: 'quiz'; q: string; options: string[]; answer: number; explain: string; cards?: string; dealerUp?: string }
  | { type: 'widget'; widget: WidgetId; title?: string; body?: string; props?: Record<string, unknown> }
  /** A hand to play; the correct answer always comes from the strategy engine. */
  | { type: 'decision'; cards: string; dealerUp: string; prompt?: string; rules?: Partial<TableRules> }

export interface Lesson {
  id: string
  title: string
  summary: string
  minutes: number
  steps: Step[]
}

export interface Level {
  n: number
  title: string
  tagline: string
  lessons: Lesson[]
}
