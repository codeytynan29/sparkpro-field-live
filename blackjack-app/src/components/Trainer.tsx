import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Card } from '../engine/cards'
import { nextSituation, situationFromCell, weaknessWeights, type DrillCategory, type Situation } from '../engine/drills'
import { describeHand } from '../engine/hand'
import { createRng, randomSeed } from '../engine/rng'
import type { TableRules } from '../engine/rules'
import { ACTION_LABEL, cellLabel, recommend, type Action } from '../engine/strategy'
import { evTable, explainRecommendation, hintFor, type DecisionFeedback } from '../engine/teaching'
import { recordDecision, recordRapid, recordWeaknessSession, type Source } from '../state/progress'
import { getProgress, update } from '../state/store'
import { Icon } from './Icons'
import { PlayingCard } from './PlayingCard'
import { FeedbackCard } from './Teaching'
import { DealerAvatar, ProgressBar } from './ui'

export type TrainerMode = 'teacher' | 'challenge' | 'weakness' | 'daily' | 'lesson'

function feedbackFor(s: Situation, action: Action, rules: TableRules): DecisionFeedback {
  const correct = s.rec.action === action
  const rows = evTable(s.cards, s.dealerUp, rules, s.allowed, action)
  const chosen = rows.find((r) => r.chosen)
  const best = rows.find((r) => r.action === s.rec.action)
  const cost = chosen && best ? best.ev - chosen.ev : 0
  const why = explainRecommendation(s.cards, s.dealerUp, s.rec, rules)
  const hand = describeHand(s.cards)
  return {
    correct,
    title: correct ? `${ACTION_LABEL[action]}: correct` : `Basic strategy says ${ACTION_LABEL[s.rec.action].toLowerCase()}`,
    message: correct
      ? `${hand} against a dealer ${s.dealerUp.rank === 'A' ? 'Ace' : s.dealerUp.rank}: ${ACTION_LABEL[action].toLowerCase()} is right.`
      : `${hand} against a dealer ${s.dealerUp.rank === 'A' ? 'Ace' : s.dealerUp.rank}: you chose ${ACTION_LABEL[action].toLowerCase()}.${cost > 0.0005 ? ` That costs about ${(cost * 100).toFixed(1)}% of your bet each time.` : ''}`,
    why,
    evRows: rows,
    closeCall: !!chosen && !!best && Math.abs(chosen.ev - best.ev) < 0.01,
  }
}

export function SituationView({ s, size = 'lg' }: { s: { cards: Card[]; dealerUp: Card }; size?: 'md' | 'lg' }) {
  return (
    <div className="felt felt-rim flex flex-col items-center gap-3 rounded-3xl px-4 py-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-200/70">Dealer shows</div>
      <div className="flex -space-x-8">
        <PlayingCard card={s.dealerUp} size={size} />
        <PlayingCard faceDown size={size} />
      </div>
      <div className="mt-2 flex -space-x-7">
        {s.cards.map((c, i) => <PlayingCard key={`${i}${c.rank}${c.suit}`} card={c} size={size} dealDelay={i * 90} />)}
      </div>
      <div className="rounded-full bg-ink-950/60 px-3 py-1 text-sm font-semibold text-cream-50">{describeHand(s.cards)}</div>
    </div>
  )
}

const BTN: Record<Action, string> = {
  hit: 'bg-[#7d2a35] text-cream-50', stand: 'bg-[#c9a24a] text-ink-950', double: 'bg-[#1d7a46] text-cream-50', split: 'bg-[#3c4f9e] text-cream-50', surrender: 'bg-[#e6dccb] text-ink-950',
}

export function ChoiceButtons({ allowed, onPick, disabled, picked, correct }: { allowed: Action[]; onPick: (a: Action) => void; disabled?: boolean; picked?: Action | null; correct?: Action | null }) {
  const order: Action[] = ['hit', 'stand', 'double', 'split', 'surrender']
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {order.filter((a) => allowed.includes(a)).map((a) => (
        <button
          key={a}
          onClick={() => onPick(a)}
          disabled={disabled}
          className={`min-h-[50px] rounded-xl px-2 text-sm font-bold shadow transition active:scale-[.97] disabled:cursor-default ${BTN[a]} ${picked && picked !== a && correct !== a ? 'opacity-30' : ''} ${correct === a && picked ? 'ring-2 ring-white' : ''}`}
        >
          {ACTION_LABEL[a]}
        </button>
      ))}
    </div>
  )
}

export interface TrainerResult { correct: number; total: number }

export function DecisionTrainer({
  mode, rules, category = 'all', count = 10, situations, onComplete, source,
}: {
  mode: TrainerMode
  rules: TableRules
  category?: DrillCategory
  count?: number
  situations?: Situation[]
  onComplete?: (r: TrainerResult) => void
  source?: Source
}) {
  const rng = useMemo(() => createRng(randomSeed()), [])
  const weights = useMemo(() => (mode === 'weakness' ? weaknessWeights(getProgress().decisions.byCell) : {}), [mode])
  const make = useCallback((i: number, avoid?: string): Situation => situations ? situations[i] : nextSituation(category, rules, rng, weights, avoid), [situations, category, rules, rng, weights])
  const total = situations ? situations.length : count
  const [i, setI] = useState(0)
  const [s, setS] = useState<Situation>(() => make(0))
  const [picked, setPicked] = useState<Action | null>(null)
  const [fb, setFb] = useState<DecisionFeedback | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [showHint, setShowHint] = useState(mode === 'teacher')
  const [misses, setMisses] = useState<{ cell: string; should: Action }[]>([])

  const pick = (a: Action) => {
    if (picked) return
    setPicked(a)
    const f = feedbackFor(s, a, rules)
    setFb(f)
    if (f.correct) setScore((x) => x + 1)
    else setMisses((m) => [...m, { cell: s.rec.cell, should: s.rec.action }])
    update((p, c) => recordDecision(p, c, { type: a, recommended: s.rec.action, correct: f.correct, cell: s.rec.cell, kind: s.rec.kind, chose: a, source: source ?? (mode === 'lesson' ? 'lesson' : mode) }))
  }

  const next = () => {
    if (i + 1 >= total) {
      setDone(true)
      const res = { correct: score, total }
      if (mode === 'weakness') update((p, c) => recordWeaknessSession(p, c, score / total, total))
      onComplete?.(res)
      return
    }
    setI(i + 1)
    setS(make(i + 1, s.rec.cell))
    setPicked(null)
    setFb(null)
    setShowHint(mode === 'teacher')
  }

  const restart = () => {
    setI(0)
    setS(make(0))
    setPicked(null)
    setFb(null)
    setScore(0)
    setMisses([])
    setDone(false)
    setShowHint(mode === 'teacher')
  }

  if (done) {
    const pct = total ? score / total : 0
    return (
      <div className="panel p-5 text-center">
        <DealerAvatar size={52} mood={pct >= 0.8 ? 'happy' : 'neutral'} />
        <div className="mt-2 font-display text-3xl text-cream-50">{score} / {total}</div>
        <p className="mt-1 text-sm text-cream-300/70">{pct === 1 ? 'Perfect. Every decision by the book.' : pct >= 0.8 ? 'Strong work. A few to tidy up.' : 'Good practice. The misses below are where the money is.'}</p>
        {misses.length > 0 && (
          <ul className="mx-auto mt-4 max-w-sm divide-y divide-white/5 text-left text-sm">
            {misses.map((m, k) => (
              <li key={k} className="flex justify-between gap-2 py-1.5"><span className="text-cream-100">{cellLabel(m.cell)}</span><span className="font-semibold text-gold-100">{ACTION_LABEL[m.should]}</span></li>
            ))}
          </ul>
        )}
        {!situations && <button className="btn-gold mt-5" onClick={restart}><Icon name="reset" size={16} /> Go again</button>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ProgressBar value={i / total} className="flex-1" />
        <span className="text-xs tabular-nums text-cream-300/60">{i + 1}/{total} · {score} correct</span>
      </div>
      <SituationView s={s} />
      {mode === 'teacher' && !picked && showHint && (
        <div className="fade-up flex items-start gap-2.5 rounded-xl border border-gold-300/25 bg-gold-400/10 p-3 text-sm text-gold-50">
          <DealerAvatar size={30} />
          <p>{hintFor(s.cards, s.dealerUp, rules)} What’s your play?</p>
        </div>
      )}
      <ChoiceButtons allowed={s.allowed} onPick={pick} disabled={!!picked} picked={picked} correct={picked ? s.rec.action : null} />
      {!picked && mode !== 'teacher' && mode !== 'daily' && (
        <button className="btn-quiet px-2 py-1 text-xs" onClick={() => setShowHint(true)}><Icon name="lightbulb" size={14} /> Hint</button>
      )}
      {!picked && showHint && mode !== 'teacher' && <p className="fade-up rounded-xl bg-gold-400/10 px-3 py-2 text-sm text-gold-100">{hintFor(s.cards, s.dealerUp, rules)}</p>}
      {fb && <FeedbackCard fb={fb} />}
      {picked && <button className="btn-gold w-full py-3" onClick={next} autoFocus>{i + 1 >= total ? 'See results' : 'Next hand'} <Icon name="arrow" size={16} /></button>}
    </div>
  )
}

/** A single lesson decision step: the answer comes from the strategy engine. */
export function SingleDecision({ cards, dealerUp, rules, prompt, onAnswered }: { cards: Card[]; dealerUp: Card; rules: TableRules; prompt?: string; onAnswered: (correct: boolean) => void }) {
  const s: Situation = useMemo(() => {
    const ctx = { canDouble: true, canSplit: cards.length === 2 && cards[0].rank === cards[1].rank || (cards.length === 2 && ['10', 'J', 'Q', 'K'].includes(cards[0].rank) && ['10', 'J', 'Q', 'K'].includes(cards[1].rank)), canSurrender: rules.lateSurrender }
    const allowed: Action[] = ['hit', 'stand', 'double']
    if (ctx.canSplit) allowed.push('split')
    if (ctx.canSurrender) allowed.push('surrender')
    const rec = recommend(cards, dealerUp, rules, ctx)
    return { id: 'lesson', cards, dealerUp, ctx, allowed, rec }
  }, [cards, dealerUp, rules])
  const [picked, setPicked] = useState<Action | null>(null)
  const fb = picked ? feedbackFor(s, picked, rules) : null
  return (
    <div className="space-y-3">
      {prompt && <p className="text-cream-100">{prompt}</p>}
      <SituationView s={s} size="md" />
      <ChoiceButtons allowed={s.allowed} disabled={!!picked} picked={picked} correct={picked ? s.rec.action : null} onPick={(a) => {
        setPicked(a)
        const ok = a === s.rec.action
        update((p, c) => recordDecision(p, c, { type: a, recommended: s.rec.action, correct: ok, cell: s.rec.cell, kind: s.rec.kind, chose: a, source: 'lesson' }))
        onAnswered(ok)
      }} />
      {fb && <FeedbackCard fb={fb} />}
    </div>
  )
}

/** Rapid fire: 20 hands, speed and accuracy tracked separately. */
export function RapidFire({ rules, category = 'all' }: { rules: TableRules; category?: DrillCategory }) {
  const N = 20
  const rng = useMemo(() => createRng(randomSeed()), [])
  const [state, setState] = useState<'ready' | 'run' | 'done'>('ready')
  const [s, setS] = useState<Situation>(() => nextSituation(category, rules, rng))
  const [i, setI] = useState(0)
  const [flash, setFlash] = useState<{ ok: boolean; should: Action } | null>(null)
  const [log, setLog] = useState<{ ok: boolean; ms: number; s: Situation; chose: Action }[]>([])
  const shownAt = useRef(0)

  useEffect(() => { if (state === 'run') shownAt.current = performance.now() }, [s, state])

  const start = () => {
    setLog([])
    setI(0)
    setS(nextSituation(category, rules, rng))
    setState('run')
  }

  const pick = (a: Action) => {
    if (flash) return
    const ms = performance.now() - shownAt.current
    const ok = a === s.rec.action
    update((p, c) => recordDecision(p, c, { type: a, recommended: s.rec.action, correct: ok, cell: s.rec.cell, kind: s.rec.kind, chose: a, source: 'rapid' }))
    const entry = { ok, ms, s, chose: a }
    setLog((l) => [...l, entry])
    setFlash({ ok, should: s.rec.action })
    setTimeout(() => {
      setFlash(null)
      if (i + 1 >= N) {
        const all = [...log, entry]
        const correct = all.filter((x) => x.ok).length
        const avg = all.reduce((t, x) => t + x.ms, 0) / all.length
        update((p, c) => recordRapid(p, c, correct, all.length, avg))
        setState('done')
      } else {
        setI(i + 1)
        setS(nextSituation(category, rules, rng, {}, s.rec.cell))
      }
    }, ok ? 350 : 1100)
  }

  if (state === 'ready') {
    return (
      <div className="panel p-6 text-center">
        <Icon name="bolt" size={36} className="mx-auto text-gold-300" />
        <h3 className="mt-2 font-display text-2xl text-cream-50">Rapid fire</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-cream-300/70">20 hands, back to back. Accuracy and speed are scored separately: get them right first, then get them fast.</p>
        <button className="btn-gold mt-4 px-8 py-3" onClick={start}>Start</button>
      </div>
    )
  }
  if (state === 'done') {
    const correct = log.filter((x) => x.ok).length
    const avg = log.reduce((t, x) => t + x.ms, 0) / log.length
    const avgOk = log.filter((x) => x.ok)
    return (
      <div className="panel p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="panel-soft p-3"><div className="label">Accuracy</div><div className="mt-1 text-2xl font-semibold text-cream-50">{Math.round((correct / log.length) * 100)}%</div></div>
          <div className="panel-soft p-3"><div className="label">Avg speed</div><div className="mt-1 text-2xl font-semibold text-cream-50">{(avg / 1000).toFixed(2)}s</div></div>
          <div className="panel-soft p-3"><div className="label">Fastest right</div><div className="mt-1 text-2xl font-semibold text-cream-50">{avgOk.length ? (Math.min(...avgOk.map((x) => x.ms)) / 1000).toFixed(2) + 's' : '—'}</div></div>
        </div>
        {log.some((x) => !x.ok) && (
          <div className="mt-4">
            <div className="label mb-1.5">Review your misses</div>
            <ul className="space-y-2">
              {log.filter((x) => !x.ok).map((x, k) => (
                <li key={k} className="panel-soft p-3 text-sm">
                  <div className="font-semibold text-cream-50">{cellLabel(x.s.rec.cell)}: {ACTION_LABEL[x.s.rec.action]} <span className="font-normal text-cream-300/60">(you: {ACTION_LABEL[x.chose]})</span></div>
                  <p className="mt-0.5 text-cream-200/75">{explainRecommendation(x.s.cards, x.s.dealerUp, x.s.rec, rules)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button className="btn-gold mt-5 w-full" onClick={start}><Icon name="reset" size={16} /> Run it again</button>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ProgressBar value={i / N} className="flex-1" />
        <span className="text-xs tabular-nums text-cream-300/60">{i + 1}/{N}</span>
      </div>
      <div className="relative">
        <SituationView s={s} />
        {flash && (
          <div className={`pop-in absolute inset-0 flex flex-col items-center justify-center rounded-3xl ${flash.ok ? 'bg-emerald-900/70' : 'bg-ruby-600/60'}`}>
            <Icon name={flash.ok ? 'check' : 'x'} size={48} />
            {!flash.ok && <div className="mt-1 text-lg font-bold">{ACTION_LABEL[flash.should]}</div>}
          </div>
        )}
      </div>
      <ChoiceButtons allowed={s.allowed} onPick={pick} disabled={!!flash} />
    </div>
  )
}

export { situationFromCell }
