import { Link } from 'react-router-dom'
import { LEVELS } from '../content'
import { Icon } from '../components/Icons'
import { PageHeader, ProgressBar } from '../components/ui'
import { unlockLevel } from '../state/progress'
import { update, useProgress } from '../state/store'

export default function Learn() {
  const p = useProgress()
  return (
    <div>
      <PageHeader eyebrow="The Academy" title="Learn" subtitle="Seven levels, from your first hand to counting a shoe. Each level unlocks the next; short lessons, real exercises." />
      <div className="space-y-4">
        {LEVELS.map((level) => <LevelCard key={level.n} n={level.n} unlocked={p.unlockedLevels.includes(level.n)} />)}
      </div>
    </div>
  )
}

export function LevelCard({ n, unlocked, compact = false }: { n: number; unlocked: boolean; compact?: boolean }) {
  const p = useProgress()
  const level = LEVELS.find((l) => l.n === n)!
  const done = level.lessons.filter((l) => p.lessons[l.id]).length
  const complete = done === level.lessons.length
  return (
    <section className={`panel overflow-hidden ${unlocked ? '' : 'opacity-80'}`}>
      <div className="flex items-start gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-bold ${complete ? 'bg-gradient-to-b from-gold-200 to-gold-500 text-ink-950' : unlocked ? 'bg-felt-700 text-cream-50' : 'bg-ink-800 text-cream-300/50'}`}>
          {complete ? <Icon name="check" /> : unlocked ? n : <Icon name="lock" size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="label">Level {n}</div>
          <h2 className="font-display text-xl text-cream-50">{level.title}</h2>
          <p className="text-sm text-cream-300/70">{level.tagline}</p>
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={done / level.lessons.length} className="max-w-[220px] flex-1" />
            <span className="text-xs tabular-nums text-cream-300/60">{done}/{level.lessons.length}</span>
          </div>
        </div>
      </div>
      {unlocked ? (
        !compact && (
          <ol className="grid border-t border-white/5 sm:grid-cols-2">
            {level.lessons.map((l, i) => {
              const d = p.lessons[l.id]
              return (
                <li key={l.id} className="border-b border-white/5 sm:odd:border-r">
                  <Link to={`/learn/${l.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[.03]">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${d ? 'bg-emerald-500 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{d ? <Icon name="check" size={14} /> : i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-cream-50">{l.title}</span>
                      <span className="block truncate text-xs text-cream-300/60">{l.summary}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-cream-300/50">{l.minutes}m</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        )
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 px-5 py-3 text-sm text-cream-300/70">
          <span>Finish Level {n - 1} to unlock.</span>
          <button className="btn-quiet px-3 py-1.5 text-xs" onClick={() => { if (confirm(`Unlock Level ${n} now? You can always go back to earlier levels.`)) update((x) => unlockLevel(x, n)) }}>I know this already: unlock</button>
        </div>
      )}
    </section>
  )
}
