import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icons'
import { DecisionTrainer, RapidFire } from '../components/Trainer'
import { Empty, PageHeader } from '../components/ui'
import { dailySituations, DRILL_CATEGORIES, type DrillCategory } from '../engine/drills'
import { seedFromString } from '../engine/rng'
import { DEFAULT_RULES, shortRules } from '../engine/rules'
import { cellLabel } from '../engine/strategy'
import { dayKey, recordDaily, topMistakes } from '../state/progress'
import { update, useProgress } from '../state/store'

type Mode = 'teacher' | 'challenge' | 'rapid' | 'weakness' | 'daily'

const MODES: { id: Mode; title: string; blurb: string; icon: string }[] = [
  { id: 'teacher', title: 'Teacher mode', blurb: 'The dealer walks you through each hand before you decide.', icon: 'learn' },
  { id: 'challenge', title: 'Challenge mode', blurb: 'No hints. Decide first, then get the full explanation.', icon: 'target' },
  { id: 'rapid', title: 'Rapid fire', blurb: '20 hands, fast. Speed and accuracy scored separately.', icon: 'bolt' },
  { id: 'weakness', title: 'Weakness training', blurb: 'Drills built from the hands you’ve missed most.', icon: 'wrench' },
  { id: 'daily', title: 'Daily challenge', blurb: 'The Daily Ten: same hands for everyone, once a day.', icon: 'sun' },
]

export default function Practice() {
  const [params, setParams] = useSearchParams()
  const mode = (params.get('mode') as Mode | null) ?? null
  const [category, setCategory] = useState<DrillCategory>('all')
  const [runKey, setRunKey] = useState(0)
  const p = useProgress()
  const rules = p.settings.rules
  const setMode = (m: Mode | null) => setParams(m ? { mode: m } : {})

  if (!mode) {
    return (
      <div>
        <PageHeader eyebrow="Training room" title="Practice" subtitle="Drill decisions until they’re automatic. Every answer is graded against basic strategy for your table rules." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className="panel group flex items-start gap-4 p-5 text-left transition hover:border-gold-300/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-felt-700 text-gold-100"><Icon name={m.icon} size={20} /></span>
              <span>
                <span className="block font-display text-lg text-cream-50">{m.title}</span>
                <span className="block text-sm text-cream-300/70">{m.blurb}</span>
                {m.id === 'daily' && p.daily[dayKey()] && <span className="chip-tag mt-2">Done today · {p.daily[dayKey()].score}/10</span>}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-cream-300/55">Table rules in use: {shortRules(rules)}. Change them under Play → Table rules or in Strategy.</p>
      </div>
    )
  }

  const info = MODES.find((m) => m.id === mode)!
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <button className="btn-quiet -ml-2 px-2" onClick={() => setMode(null)} aria-label="Back to practice modes"><Icon name="back" size={18} /></button>
        <div className="min-w-0 flex-1">
          <div className="label">Practice</div>
          <h1 className="font-display text-2xl text-cream-50">{info.title}</h1>
        </div>
      </div>
      {(mode === 'teacher' || mode === 'challenge' || mode === 'rapid') && (
        <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
          {DRILL_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => { setCategory(c.id); setRunKey((k) => k + 1) }} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${category === c.id ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`} title={c.blurb}>{c.label}</button>
          ))}
        </div>
      )}
      {mode === 'teacher' && <DecisionTrainer key={`t${runKey}`} mode="teacher" rules={category === 'surrender' ? { ...rules, lateSurrender: true } : rules} category={category} count={10} />}
      {mode === 'challenge' && <DecisionTrainer key={`c${runKey}`} mode="challenge" rules={category === 'surrender' ? { ...rules, lateSurrender: true } : rules} category={category} count={15} />}
      {mode === 'rapid' && <RapidFire key={`r${runKey}`} rules={category === 'surrender' ? { ...rules, lateSurrender: true } : rules} category={category} />}
      {mode === 'weakness' && <Weakness />}
      {mode === 'daily' && <Daily />}
    </div>
  )
}

function Weakness() {
  const p = useProgress()
  const top = topMistakes(p, 5)
  const [started, setStarted] = useState(false)
  if (!top.length) {
    return <Empty title="No weak spots yet" body="Play some hands or run a few drills. Once you miss something, this mode builds practice around it." action={<Link to="/practice?mode=challenge" className="btn-gold mt-2">Try Challenge mode</Link>} />
  }
  if (!started) {
    return (
      <div className="panel p-5">
        <p className="text-sm text-cream-200/80">Your most-missed hands. The next 12 drills are weighted heavily toward these, with a few others mixed in so you don’t just memorize a list.</p>
        <ul className="mt-3 divide-y divide-white/5">
          {top.map((m) => (
            <li key={m.cell} className="flex items-center justify-between py-2 text-sm">
              <span className="text-cream-50">{m.cell === 'insurance' ? 'Insurance offers' : cellLabel(m.cell)}</span>
              <span className="text-ruby-400">{m.wrong} of {m.total} missed</span>
            </li>
          ))}
        </ul>
        <button className="btn-gold mt-4 w-full" onClick={() => setStarted(true)}>Start weakness training</button>
      </div>
    )
  }
  return <DecisionTrainer mode="weakness" rules={p.settings.rules} count={12} />
}

function Daily() {
  const p = useProgress()
  const date = dayKey()
  const rules = useMemo(() => ({ ...DEFAULT_RULES }), [])
  const situations = useMemo(() => dailySituations(date, rules, seedFromString(date)), [date, rules])
  const done = p.daily[date]
  const [replay, setReplay] = useState(false)
  if (done && !replay) {
    return (
      <div className="panel p-6 text-center">
        <Icon name="sun" size={32} className="mx-auto text-gold-300" />
        <div className="mt-2 font-display text-3xl text-cream-50">{done.score}/10</div>
        <p className="mt-1 text-sm text-cream-300/70">Today’s Daily Ten is done. A new set arrives at midnight.</p>
        <button className="btn-ghost mt-4" onClick={() => setReplay(true)}>Replay for practice</button>
      </div>
    )
  }
  return (
    <div>
      <p className="mb-3 text-xs text-cream-300/60">Standard rules for everyone: {shortRules(rules)}. No hints today.</p>
      <DecisionTrainer mode="daily" rules={rules} situations={situations} onComplete={(r) => update((x, c) => recordDaily(x, c, date, r.correct))} />
    </div>
  )
}
