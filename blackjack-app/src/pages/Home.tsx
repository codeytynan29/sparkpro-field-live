import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LEVELS, nextLesson } from '../content'
import { Icon } from '../components/Icons'
import { PlayingCard } from '../components/PlayingCard'
import { DealerAvatar, ProgressBar, Ring } from '../components/ui'
import { parseCard } from '../engine/cards'
import { cellLabel } from '../engine/strategy'
import { accuracy, ACHIEVEMENTS, dayKey, levelFor, liveStreak, rankFor, topMistakes } from '../state/progress'
import { update, useProgress } from '../state/store'

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Late night at the tables' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const p = useProgress()
  const lv = levelFor(p.xp)
  const rank = rankFor(lv.level)
  const streak = liveStreak(p)
  const acc = accuracy(p.decisions)
  const next = nextLesson(p.lessons, p.unlockedLevels)
  const today = dayKey()
  const daily = p.daily[today]
  const recent = Object.entries(p.achievements).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean)
  const weak = topMistakes(p, 1)[0]
  const totalLessons = LEVELS.reduce((n, l) => n + l.lessons.length, 0)
  const done = Object.keys(p.lessons).length
  const [name, setName] = useState('')
  const isNew = p.decisions.total === 0 && done === 0

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="felt felt-rim relative overflow-hidden rounded-[28px] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-6 -top-4 hidden rotate-12 gap-2 opacity-90 sm:flex" aria-hidden="true">
          <PlayingCard card={parseCard('AS')} size="xl" className="-rotate-6" />
          <PlayingCard card={parseCard('KH')} size="xl" className="rotate-6 -ml-10 mt-6" />
        </div>
        <div className="relative max-w-xl">
          <div className="label">{greeting()}{p.name ? `, ${p.name}` : ''}</div>
          <h1 className="mt-1 text-3xl font-semibold leading-tight text-cream-50 sm:text-5xl">
            Learn the game. <span className="gold-text">Master the strategy.</span> Own the table.
          </h1>
          {!p.name && (
            <form className="mt-4 flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) update((x) => { x.name = name.trim().slice(0, 24) }) }}>
              <input className="input" placeholder="What should the dealer call you?" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
              <button className="btn-gold shrink-0" type="submit">Sit down</button>
            </form>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {next ? (
              <Link to={`/learn/${next.lesson.id}`} className="btn-gold px-5 py-3">
                <Icon name="learn" size={18} /> {isNew ? 'Start learning' : 'Continue learning'}
              </Link>
            ) : (
              <Link to="/practice" className="btn-gold px-5 py-3"><Icon name="practice" size={18} /> Keep sharp</Link>
            )}
            <Link to="/play" className="btn-felt px-5 py-3"><Icon name="play" size={18} /> Quick play</Link>
          </div>
        </div>
      </section>

      {/* Rank strip */}
      <section className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="panel flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-gold-200 to-gold-500 font-display text-2xl font-bold text-ink-950">{lv.level}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-display text-xl text-cream-50">{rank.title}</div>
              <div className="text-xs tabular-nums text-cream-300/60">{lv.into}/{lv.needed} XP</div>
            </div>
            <ProgressBar value={lv.progress} className="mt-2" />
            <div className="mt-1.5 truncate text-xs text-cream-300/60">{rank.blurb}</div>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full ${streak ? 'bg-gold-400/20 text-gold-200' : 'bg-white/5 text-cream-300/50'}`}><Icon name="flame" size={24} /></span>
          <div>
            <div className="text-2xl font-semibold text-cream-50">{streak} day{streak === 1 ? '' : 's'}</div>
            <div className="text-xs text-cream-300/60">Training streak · best {p.streak.best}</div>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <Ring value={acc} size={54} />
          <div>
            <div className="text-sm font-semibold text-cream-50">Basic strategy accuracy</div>
            <div className="text-xs text-cream-300/60">{p.decisions.total ? `${p.decisions.correct} of ${p.decisions.total} decisions` : 'Make your first decision'}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {/* Daily challenge */}
        <Link to="/practice?mode=daily" className="panel group flex items-center gap-4 p-5 transition hover:border-gold-300/40">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/15 text-gold-200"><Icon name="sun" size={24} /></span>
          <div className="min-w-0 flex-1">
            <div className="label">Daily challenge</div>
            <div className="font-display text-lg text-cream-50">The Daily Ten</div>
            <div className="text-sm text-cream-300/70">{daily ? `Done today: ${daily.score}/10. Come back tomorrow for a new set.` : 'Ten hands, the same for everyone today. Can you go 10 for 10?'}</div>
          </div>
          {daily ? <span className="chip-tag">{daily.score}/10</span> : <Icon name="arrow" className="text-gold-300 transition group-hover:translate-x-1" />}
        </Link>

        {/* Recommended */}
        {next ? (
          <Link to={`/learn/${next.lesson.id}`} className="panel group flex items-center gap-4 p-5 transition hover:border-gold-300/40">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-felt-700 text-cream-50"><Icon name="book" size={22} /></span>
            <div className="min-w-0 flex-1">
              <div className="label">Recommended next · Level {next.level.n}</div>
              <div className="font-display text-lg text-cream-50">{next.lesson.title}</div>
              <div className="truncate text-sm text-cream-300/70">{next.lesson.summary} · {next.lesson.minutes} min</div>
            </div>
            <Icon name="arrow" className="text-gold-300 transition group-hover:translate-x-1" />
          </Link>
        ) : (
          <div className="panel p-5"><div className="label">Academy</div><div className="font-display text-lg text-cream-50">Every lesson complete</div><p className="text-sm text-cream-300/70">Keep your edge sharp in Practice.</p></div>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <div className="label">Recent achievements</div>
            <Link to="/progress" className="text-xs text-gold-200 hover:underline">All {ACHIEVEMENTS.length}</Link>
          </div>
          {recent.length ? (
            <ul className="mt-3 space-y-2">
              {recent.map((a) => (
                <li key={a!.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-400 text-ink-950"><Icon name={a!.icon} size={18} /></span>
                  <div><div className="text-sm font-semibold text-cream-50">{a!.title}</div><div className="text-xs text-cream-300/60">{a!.description}</div></div>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-cream-300/60">Your first one is a lesson away.</p>}
        </div>
        <div className="panel flex gap-3 p-5">
          <DealerAvatar size={44} />
          <div className="min-w-0">
            <div className="label">From your dealer</div>
            {weak ? (
              <>
                <p className="mt-1 text-sm text-cream-100">Your most-missed spot is <b>{cellLabel(weak.cell)}</b> ({weak.wrong} of {weak.total} wrong). Let’s fix it.</p>
                <Link to="/practice?mode=weakness" className="btn-ghost mt-3 px-3 py-2 text-xs"><Icon name="wrench" size={14} /> Weakness training</Link>
              </>
            ) : (
              <p className="mt-1 text-sm text-cream-100">{isNew ? 'Never played? Perfect. Start with Level 1. In about twenty minutes you’ll know enough to sit at a table.' : `You’ve finished ${done} of ${totalLessons} lessons. Every correct decision earns XP. Winning chips never does.`}</p>
            )}
          </div>
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-cream-300/40">Training chips only. No real-money gambling. If gambling stops being fun, call or text 1-800-GAMBLER.</p>
    </div>
  )
}
