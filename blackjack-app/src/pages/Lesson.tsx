import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { findLesson, LEVELS, type Step } from '../content'
import { Icon } from '../components/Icons'
import { PlayingCard } from '../components/PlayingCard'
import { SingleDecision } from '../components/Trainer'
import { DealerAvatar, ProgressBar, Rich } from '../components/ui'
import { Widget } from '../components/widgets'
import { parseCard, parseCards } from '../engine/cards'
import { sanitizeRules } from '../engine/rules'
import { completeLesson, unlockLevel } from '../state/progress'
import { update, useProgress } from '../state/store'

export default function LessonPage() {
  const { lessonId = '' } = useParams()
  // Keyed by lesson so step index and answers never carry over to a different lesson.
  return <LessonView key={lessonId} lessonId={lessonId} />
}

function LessonView({ lessonId }: { lessonId: string }) {
  const found = findLesson(lessonId)
  const p = useProgress()
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const [finished, setFinished] = useState(false)

  if (!found) {
    return (
      <div className="panel mx-auto max-w-md p-6 text-center">
        <p className="font-display text-xl text-cream-50">Lesson not found</p>
        <Link className="btn-gold mt-4" to="/learn">Back to the Academy</Link>
      </div>
    )
  }
  const { level, lesson, index } = found
  if (!p.unlockedLevels.includes(level.n)) {
    return (
      <div className="panel mx-auto max-w-md p-6 text-center">
        <Icon name="lock" size={28} className="mx-auto text-gold-300" />
        <p className="mt-2 font-display text-xl text-cream-50">Level {level.n} is locked</p>
        <p className="mt-1 text-sm text-cream-300/70">Finish Level {level.n - 1} first, or unlock it if you already know the basics.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link className="btn-ghost" to="/learn">Academy</Link>
          <button className="btn-gold" onClick={() => update((x) => unlockLevel(x, level.n))}>Unlock Level {level.n}</button>
        </div>
      </div>
    )
  }

  const step = lesson.steps[i]
  const gated = (step.type === 'quiz' || step.type === 'decision') && answers[i] === undefined
  const graded = lesson.steps.map((s, k) => ({ s, k })).filter(({ s }) => s.type === 'quiz' || s.type === 'decision')
  const nextInLevel = level.lessons[index + 1]
  const nextLevel = LEVELS.find((l) => l.n === level.n + 1)

  const finish = () => {
    const score = graded.length ? graded.filter(({ k }) => answers[k]).length / graded.length : 1
    update((x, c) => completeLesson(x, c, lesson.id, score, level.lessons.map((l) => l.id), level.n))
    setFinished(true)
  }

  if (finished) {
    const right = graded.filter(({ k }) => answers[k]).length
    const target = nextInLevel ? `/learn/${nextInLevel.id}` : nextLevel ? `/learn/${nextLevel.lessons[0].id}` : '/practice'
    return (
      <div className="mx-auto max-w-xl">
        <div className="panel fade-up p-6 text-center">
          <DealerAvatar size={60} mood="happy" />
          <div className="label mt-3">Lesson complete</div>
          <h1 className="mt-1 font-display text-3xl text-cream-50">{lesson.title}</h1>
          {graded.length > 0 && <p className="mt-2 text-sm text-cream-300/70">{right} of {graded.length} answered correctly{right === graded.length ? '. Perfect.' : '.'}</p>}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/learn" className="btn-ghost">Academy</Link>
            <button className="btn-gold" onClick={() => nav(target)}>
              {nextInLevel ? `Next: ${nextInLevel.title}` : nextLevel ? `Start Level ${nextLevel.n}` : 'Go practice'} <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/learn" className="btn-quiet -ml-2 px-2" aria-label="Back to Academy"><Icon name="back" size={18} /></Link>
        <div className="min-w-0 flex-1">
          <div className="label">Level {level.n} · Lesson {index + 1} of {level.lessons.length}</div>
          <div className="truncate font-display text-lg text-cream-50">{lesson.title}</div>
        </div>
        <span className="text-xs tabular-nums text-cream-300/60">{i + 1}/{lesson.steps.length}</span>
      </div>
      <ProgressBar value={(i + 1) / lesson.steps.length} className="mb-5" />
      <div key={`${lesson.id}-${i}`} className="fade-up">
        <StepView step={step} answered={answers[i]} onAnswer={(ok) => setAnswers((a) => (a[i] === undefined ? { ...a, [i]: ok } : a))} />
      </div>
      <div className="safe-bottom sticky bottom-[64px] z-10 mt-6 flex gap-2 bg-gradient-to-t from-ink-950 via-ink-950/90 to-transparent pb-3 pt-6 lg:bottom-0">
        <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}><Icon name="back" size={16} /> Back</button>
        {i < lesson.steps.length - 1 ? (
          <button className="btn-gold flex-1" disabled={gated} onClick={() => setI(i + 1)}>{gated ? 'Answer to continue' : 'Continue'} {!gated && <Icon name="arrow" size={16} />}</button>
        ) : (
          <button className="btn-gold flex-1" disabled={gated} onClick={finish}>Finish lesson <Icon name="check" size={16} /></button>
        )}
      </div>
    </div>
  )
}

function StepView({ step, answered, onAnswer }: { step: Step; answered?: boolean; onAnswer: (ok: boolean) => void }) {
  const p = useProgress()
  if (step.type === 'text') {
    return (
      <article className="panel p-5 sm:p-6">
        {step.title && <h2 className="font-display text-2xl text-cream-50">{step.title}</h2>}
        {step.cards && (
          <div className="my-4 flex justify-center gap-6 rounded-2xl bg-felt-800/50 p-4">
            {step.dealerUp && <div className="flex flex-col items-center gap-1"><PlayingCard card={parseCard(step.dealerUp)} size="md" /><span className="text-[10px] uppercase tracking-wider text-gold-200/60">Dealer</span></div>}
            <div className="flex -space-x-6">{parseCards(step.cards).map((c, k) => <PlayingCard key={k} card={c} size="md" dealDelay={k * 120} />)}</div>
          </div>
        )}
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-cream-200/90">
          {step.body.map((b, k) => <p key={k}><Rich text={b} /></p>)}
        </div>
        {step.tip && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold-300/25 bg-gold-400/10 p-3.5">
            <DealerAvatar size={32} />
            <p className="text-sm text-gold-50"><Rich text={step.tip} /></p>
          </div>
        )}
      </article>
    )
  }
  if (step.type === 'quiz') return <Quiz step={step} answered={answered} onAnswer={onAnswer} />
  if (step.type === 'decision') {
    const rules = sanitizeRules({ ...p.settings.rules, ...(step.rules ?? {}) })
    return (
      <div className="panel p-5">
        <div className="label mb-2">Your decision</div>
        <SingleDecision cards={parseCards(step.cards)} dealerUp={parseCard(step.dealerUp)} rules={rules} prompt={step.prompt} onAnswered={onAnswer} />
        <p className="mt-3 text-[11px] text-cream-300/50">Graded against basic strategy for your table rules{step.rules?.lateSurrender ? ' with late surrender' : ''}.</p>
      </div>
    )
  }
  return (
    <div className="panel p-5">
      {step.title && <h2 className="font-display text-xl text-cream-50">{step.title}</h2>}
      {step.body && <p className="mb-4 mt-1 text-sm text-cream-300/70">{step.body}</p>}
      <Widget id={step.widget} props={step.props} />
    </div>
  )
}

function Quiz({ step, answered, onAnswer }: { step: Extract<Step, { type: 'quiz' }>; answered?: boolean; onAnswer: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const order = useMemo(() => step.options.map((_, k) => k), [step])
  return (
    <div className="panel p-5 sm:p-6">
      <div className="label mb-2">Quick check</div>
      <h2 className="font-display text-xl leading-snug text-cream-50">{step.q}</h2>
      {step.cards && (
        <div className="my-4 flex justify-center gap-6 rounded-2xl bg-felt-800/50 p-4">
          {step.dealerUp && <div className="flex flex-col items-center gap-1"><PlayingCard card={parseCard(step.dealerUp)} size="sm" /><span className="text-[10px] uppercase tracking-wider text-gold-200/60">Dealer</span></div>}
          <div className="flex -space-x-5">{parseCards(step.cards).map((c, k) => <PlayingCard key={k} card={c} size="sm" />)}</div>
        </div>
      )}
      <div className="mt-4 space-y-2" role="radiogroup">
        {order.map((k) => {
          const o = step.options[k]
          const state = picked == null ? 'idle' : k === step.answer ? 'right' : k === picked ? 'wrong' : 'dim'
          return (
            <button
              key={k}
              role="radio"
              aria-checked={picked === k}
              disabled={picked != null || answered !== undefined}
              onClick={() => { setPicked(k); onAnswer(k === step.answer) }}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${state === 'right' ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100' : state === 'wrong' ? 'border-ruby-400 bg-ruby-500/15 text-ruby-400' : state === 'dim' ? 'border-white/5 text-cream-300/40' : 'border-white/10 bg-ink-850 text-cream-100 hover:border-gold-400/40'}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{String.fromCharCode(65 + k)}</span>
              {o}
            </button>
          )
        })}
      </div>
      {picked != null && (
        <div className={`fade-up mt-4 rounded-xl p-3.5 text-sm ${picked === step.answer ? 'bg-emerald-500/10 text-emerald-100' : 'bg-ruby-500/10 text-cream-100'}`}>
          <b>{picked === step.answer ? 'Correct.' : 'Not quite.'}</b> {step.explain}
        </div>
      )}
    </div>
  )
}
