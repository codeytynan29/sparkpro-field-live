import { Link } from 'react-router-dom'
import { LEVELS } from '../content'
import { Icon } from '../components/Icons'
import { Empty, PageHeader, ProgressBar, Ring, Stat } from '../components/ui'
import { money } from '../components/Chip'
import { cellLabel, ACTION_LABEL } from '../engine/strategy'
import { accuracy, ACHIEVEMENTS, levelFor, liveStreak, rankFor, RANKS, topMistakes, xpForLevel, type DayStat, type DecisionType } from '../state/progress'
import { useProgress } from '../state/store'

function pctText(v: number | null) {
  return v == null ? '—' : `${Math.round(v * 100)}%`
}

function AccuracyChart({ history }: { history: DayStat[] }) {
  const days = history.filter((d) => d.decisions > 0).slice(-21)
  if (days.length < 2) return <p className="py-6 text-center text-sm text-cream-300/60">Train on two different days to see your trend.</p>
  const W = 300
  const H = 100
  const pts = days.map((d, i) => [(i / (days.length - 1)) * (W - 20) + 10, H - 10 - (d.correct / d.decisions) * (H - 20)] as const)
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full" role="img" aria-label="Daily decision accuracy">
      {[0, 0.5, 1].map((g) => <line key={g} x1="10" x2={W - 10} y1={H - 10 - g * (H - 20)} y2={H - 10 - g * (H - 20)} stroke="rgba(255,255,255,.07)" />)}
      <text x="0" y="13" fontSize="7" fill="#e6d9b8" opacity=".5">100%</text>
      <text x="0" y={H - 7} fontSize="7" fill="#e6d9b8" opacity=".5">0%</text>
      <path d={`${path} L${pts[pts.length - 1][0]} ${H - 10} L${pts[0][0]} ${H - 10} Z`} fill="rgba(212,166,59,.12)" />
      <path d={path} fill="none" stroke="#d4a63b" strokeWidth="2" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#ead28c" />)}
      <text x="10" y={H + 10} fontSize="7" fill="#e6d9b8" opacity=".6">{days[0].date.slice(5)}</text>
      <text x={W - 10} y={H + 10} fontSize="7" fill="#e6d9b8" opacity=".6" textAnchor="end">{days[days.length - 1].date.slice(5)}</text>
    </svg>
  )
}

export default function ProgressPage() {
  const p = useProgress()
  const lv = levelFor(p.xp)
  const rank = rankFor(lv.level)
  const acc = accuracy(p.decisions)
  const mistakes = topMistakes(p, 8)
  const lessonsTotal = LEVELS.reduce((n, l) => n + l.lessons.length, 0)
  const lessonsDone = Object.keys(p.lessons).length
  const actions: DecisionType[] = ['hit', 'stand', 'double', 'split', 'surrender', 'insurance']
  const nextRank = RANKS.find((r) => r.min > lv.level)
  const rcAcc = accuracy({ total: p.counting.rcAttempts, correct: p.counting.rcCorrect })
  const tcAcc = accuracy({ total: p.counting.tcAttempts, correct: p.counting.tcCorrect })
  const recentDays = p.history.slice(-7)
  const recent = recentDays.reduce((a, d) => ({ total: a.total + d.decisions, correct: a.correct + d.correct }), { total: 0, correct: 0 })
  const earlier = p.history.slice(0, -7).reduce((a, d) => ({ total: a.total + d.decisions, correct: a.correct + d.correct }), { total: 0, correct: 0 })
  const recentAcc = accuracy(recent)
  const earlierAcc = accuracy(earlier)

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={p.name || 'Your record'} title="My Progress" subtitle="Decision quality and game results, tracked separately. You can lose ten hands in a row and still be playing perfectly." />

      <section className="panel flex flex-wrap items-center gap-5 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-gold-200 to-gold-500 font-display text-3xl font-bold text-ink-950">{lv.level}</div>
        <div className="min-w-[200px] flex-1">
          <div className="font-display text-2xl text-cream-50">{rank.title}</div>
          <div className="text-sm text-cream-300/70">{rank.blurb}</div>
          <ProgressBar value={lv.progress} className="mt-2" />
          <div className="mt-1 text-xs text-cream-300/60">{p.xp.toLocaleString()} XP · {xpForLevel(lv.level + 1) - p.xp} to level {lv.level + 1}{nextRank ? ` · ${nextRank.title} at level ${nextRank.min}` : ''}</div>
        </div>
        <div className="flex gap-4">
          <div className="text-center"><div className="text-2xl font-semibold text-cream-50">{liveStreak(p)}</div><div className="text-[11px] uppercase tracking-wider text-cream-300/60">Day streak</div></div>
          <div className="text-center"><div className="text-2xl font-semibold text-cream-50">{p.streak.best}</div><div className="text-[11px] uppercase tracking-wider text-cream-300/60">Best</div></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-cream-50">Decision quality</h2>
            <span className="chip-tag">Basic strategy</span>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <Ring value={acc} size={92} stroke={8} sub="accuracy" />
            <div className="grid flex-1 grid-cols-2 gap-2">
              <Stat label="Correct" value={p.decisions.correct.toLocaleString()} />
              <Stat label="Incorrect" value={(p.decisions.total - p.decisions.correct).toLocaleString()} />
              <Stat label="Best streak" value={p.decisions.bestStreak} />
              <Stat label="Current streak" value={p.decisions.streak} />
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            {actions.map((a) => {
              const t = p.decisions.byAction[a]
              const v = accuracy(t)
              return (
                <div key={a} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-cream-100">{a === 'insurance' ? 'Insurance' : ACTION_LABEL[a]}</span>
                  <ProgressBar value={v ?? 0} className="flex-1" tone={v != null && v < 0.7 ? 'ruby' : 'gold'} />
                  <span className="w-20 shrink-0 text-right text-xs tabular-nums text-cream-300/70">{pctText(v)} <span className="text-cream-300/40">({t.total})</span></span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-cream-300/50">Each row is how often you made the right call when that move was the correct one. Insurance counts every offer you received.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(['hard', 'soft', 'pair'] as const).map((k) => <Stat key={k} label={k === 'pair' ? 'Pairs' : `${k} totals`} value={pctText(accuracy(p.decisions.byKind[k]))} hint={`${p.decisions.byKind[k].total} hands`} />)}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-cream-50">Game results</h2>
            <span className="chip-tag">Outcomes</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Hands played" value={p.hands.played.toLocaleString()} />
            <Stat label="Won" value={p.hands.won} />
            <Stat label="Lost" value={p.hands.lost} />
            <Stat label="Pushed" value={p.hands.pushed} />
            <Stat label="Blackjacks" value={p.hands.blackjacks} />
            <Stat label="Training chips" value={money(p.chips.bankroll)} hint={p.chips.resets ? `${p.chips.resets} reset${p.chips.resets > 1 ? 's' : ''}` : undefined} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/30 p-3.5">
              <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Right play, lost anyway</div>
              <div className="mt-1 text-2xl font-semibold text-cream-50">{p.hands.correctLosses}</div>
              <div className="text-xs text-cream-300/60">Bad luck, good decisions</div>
            </div>
            <div className="rounded-xl border border-gold-400/30 bg-gold-400/5 p-3.5">
              <div className="text-[11px] uppercase tracking-wider text-gold-200/80">Wrong play, won anyway</div>
              <div className="mt-1 text-2xl font-semibold text-cream-50">{p.hands.mistakeWins}</div>
              <div className="text-xs text-cream-300/60">Lucky, but costly over time</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-cream-200/70">Winning and losing hands earns no XP. Only decisions and learning do.</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-display text-xl text-cream-50">Improvement over time</h2>
          <div className="mt-3"><AccuracyChart history={p.history} /></div>
          {recentAcc != null && earlierAcc != null && (
            <p className="mt-2 text-sm text-cream-200/80">Last 7 days: <b className="text-cream-50">{pctText(recentAcc)}</b> vs <b className="text-cream-50">{pctText(earlierAcc)}</b> before that. {recentAcc > earlierAcc ? 'You’re improving.' : recentAcc < earlierAcc ? 'A little rusty. A weakness session will help.' : 'Holding steady.'}</p>
          )}
        </div>
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-cream-50">Most frequent mistakes</h2>
            {mistakes.length > 0 && <Link to="/practice?mode=weakness" className="btn-ghost px-3 py-1.5 text-xs"><Icon name="wrench" size={14} /> Train these</Link>}
          </div>
          {mistakes.length ? (
            <ul className="mt-3 divide-y divide-white/5">
              {mistakes.map((m) => (
                <li key={m.cell} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-cream-50">{m.cell === 'insurance' ? 'Insurance offers' : cellLabel(m.cell)}</span>
                  <span className="text-xs text-cream-300/70"><b className="text-ruby-400">{m.wrong}</b> of {m.total} wrong</span>
                </li>
              ))}
            </ul>
          ) : <div className="mt-3"><Empty title="No mistakes yet" body="Either you’re perfect or you haven’t played. Let’s find out." /></div>}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h2 className="font-display text-xl text-cream-50">Lessons</h2>
          <div className="mt-2 text-3xl font-semibold text-cream-50">{lessonsDone}<span className="text-lg text-cream-300/60">/{lessonsTotal}</span></div>
          <div className="mt-3 space-y-2">
            {LEVELS.map((l) => {
              const d = l.lessons.filter((x) => p.lessons[x.id]).length
              return (
                <div key={l.n} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-cream-300/70">Level {l.n}</span>
                  <ProgressBar value={d / l.lessons.length} className="flex-1" />
                  <span className="w-8 text-right tabular-nums text-cream-300/60">{d}/{l.lessons.length}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="font-display text-xl text-cream-50">Card counting</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Running count" value={pctText(rcAcc)} hint={`${p.counting.rcAttempts} checks`} />
            <Stat label="True count" value={pctText(tcAcc)} hint={`${p.counting.tcAttempts} conversions`} />
            <Stat label="Decks counted" value={p.counting.decksCounted} />
            <Stat label="Best deck time" value={p.counting.bestDeckMs ? `${(p.counting.bestDeckMs / 1000).toFixed(1)}s` : '—'} />
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="font-display text-xl text-cream-50">Personal bests</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Rapid fire best" value={p.rapid.runs ? `${p.rapid.bestCorrect}/20` : '—'} hint={`${p.rapid.runs} runs`} />
            <Stat label="Fastest avg (80%+)" value={p.rapid.bestAvgMs ? `${(p.rapid.bestAvgMs / 1000).toFixed(2)}s` : '—'} />
            <Stat label="Daily challenges" value={Object.keys(p.daily).length} />
            <Stat label="Hand signals" value={p.signals.attempts ? `${p.signals.correct}/${p.signals.attempts}` : '—'} />
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-cream-50">Achievements</h2>
          <span className="text-sm text-cream-300/60">{Object.keys(p.achievements).length}/{ACHIEVEMENTS.length}</span>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = p.achievements[a.id]
            return (
              <li key={a.id} className={`flex items-center gap-3 rounded-xl border p-3 ${got ? 'border-gold-300/35 bg-gold-400/5' : 'border-white/5 bg-ink-850/60'}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${got ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-300/30'}`}><Icon name={got ? a.icon : 'lock'} size={18} /></span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${got ? 'text-cream-50' : 'text-cream-300/60'}`}>{a.title}</span>
                  <span className="block text-xs text-cream-300/55">{a.description}</span>
                  {got && <span className="block text-[10px] text-gold-200/60">{new Date(got).toLocaleDateString()}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
