import { formatEV } from '../engine/ev'
import { ACTION_LABEL } from '../engine/strategy'
import type { DecisionFeedback, EvRow, HandBreakdown, Verdict } from '../engine/teaching'
import { CardRow } from './PlayingCard'
import { DealerAvatar } from './ui'
import { Icon } from './Icons'
import { describeHand, handValue } from '../engine/hand'
import { money } from './Chip'

export function EvBars({ rows, note = true }: { rows: EvRow[]; note?: boolean }) {
  if (!rows.length) return null
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.ev)))
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.action} className="flex items-center gap-2 text-xs">
          <span className={`w-20 shrink-0 font-medium ${r.best ? 'text-gold-100' : 'text-cream-300/70'}`}>
            {ACTION_LABEL[r.action]}
            {r.chosen && <span className="ml-1 text-[10px] text-cream-300/50">(you)</span>}
          </span>
          <div className="relative h-4 flex-1 overflow-hidden rounded bg-white/5">
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
            <div
              className={`absolute inset-y-0.5 rounded-sm ${r.ev >= 0 ? 'left-1/2 bg-emerald-400/80' : 'right-1/2 bg-ruby-500/80'} ${r.best ? 'ring-1 ring-gold-200' : ''}`}
              style={{ width: `${(Math.abs(r.ev) / max) * 50}%` }}
            />
          </div>
          <span className={`w-14 shrink-0 text-right tabular-nums ${r.best ? 'font-semibold text-gold-100' : 'text-cream-300/70'}`}>{formatEV(r.ev)}</span>
        </div>
      ))}
      {note && <p className="pt-1 text-[10.5px] leading-snug text-cream-300/45">Average result per $1 originally bet, computed for this table’s soft-17 and double-after-split rules (infinite-deck model, after the dealer checks for blackjack).</p>}
    </div>
  )
}

export function FeedbackCard({ fb, compact = false }: { fb: DecisionFeedback; compact?: boolean }) {
  return (
    <div className={`fade-up rounded-xl border p-3.5 ${fb.correct ? 'border-emerald-400/30 bg-emerald-950/40' : 'border-ruby-400/35 bg-ruby-600/10'}`} role="status">
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${fb.correct ? 'bg-emerald-500 text-ink-950' : 'bg-ruby-500 text-cream-50'}`}>
          <Icon name={fb.correct ? 'check' : 'x'} size={14} />
        </span>
        <span className="font-semibold text-cream-50">{fb.title}</span>
      </div>
      <p className="mt-2 text-sm text-cream-200/85">{fb.message}</p>
      {!compact && <p className="mt-2 text-sm text-cream-200/75">{fb.why}</p>}
      {!compact && fb.evRows.length > 0 && <div className="mt-3"><EvBars rows={fb.evRows} /></div>}
      {fb.closeCall && <p className="mt-2 text-xs text-gold-200/80">Close call: these options are within 1% of a bet of each other.</p>}
    </div>
  )
}

const VERDICT_STYLE: Record<Verdict, { tone: string; badge: string; mood: 'happy' | 'neutral' | 'concerned' }> = {
  'correct-win': { tone: 'border-emerald-400/30', badge: 'bg-emerald-500 text-ink-950', mood: 'happy' },
  'correct-loss': { tone: 'border-emerald-400/30', badge: 'bg-emerald-500 text-ink-950', mood: 'neutral' },
  'correct-push': { tone: 'border-emerald-400/30', badge: 'bg-emerald-500 text-ink-950', mood: 'happy' },
  'mistake-win': { tone: 'border-gold-400/40', badge: 'bg-gold-400 text-ink-950', mood: 'concerned' },
  'mistake-loss': { tone: 'border-ruby-400/40', badge: 'bg-ruby-500 text-cream-50', mood: 'concerned' },
  'mistake-push': { tone: 'border-ruby-400/40', badge: 'bg-ruby-500 text-cream-50', mood: 'concerned' },
}

export function verdictParts(v: Verdict) {
  const [d, r] = v.split('-')
  return { decision: d === 'correct' ? 'Correct decision' : 'Wrong decision', result: r === 'win' ? 'Won' : r === 'loss' ? 'Lost' : 'Push' }
}

export function BreakdownCard({ b, index, showCards = true }: { b: HandBreakdown; index?: number; showCards?: boolean }) {
  const st = b.verdict ? VERDICT_STYLE[b.verdict] : null
  const parts = b.verdict ? verdictParts(b.verdict) : null
  const dv = handValue(b.dealer)
  return (
    <article className={`panel fade-up p-4 ${st?.tone ?? ''}`}>
      <div className="flex items-start gap-3">
        <DealerAvatar mood={st?.mood ?? 'happy'} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {index != null && <span className="text-[11px] font-semibold uppercase tracking-wider text-cream-300/50">Hand {index + 1}</span>}
            {parts && (
              <>
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${b.verdict!.startsWith('correct') ? 'bg-emerald-500/90 text-ink-950' : 'bg-ruby-500/90 text-cream-50'}`}>{parts.decision}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-cream-100">{parts.result} {money(b.net, true)}</span>
              </>
            )}
            {!parts && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-cream-100">{money(b.net, true)}</span>}
          </div>
          <h3 className="mt-1 font-display text-lg leading-snug text-cream-50">{b.title}</h3>
        </div>
      </div>
      {showCards && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-cream-300/70">
          <div>
            <div className="mb-1">You: {describeHand(b.cards)}</div>
            <CardRow cards={b.cards} size="xs" />
          </div>
          <div>
            <div className="mb-1">Dealer: {dv.blackjack ? 'Blackjack' : dv.bust ? `Bust (${dv.total})` : dv.total}</div>
            <CardRow cards={b.dealer} size="xs" />
          </div>
        </div>
      )}
      {b.decisions.length > 0 && (
        <ol className="mt-3 space-y-1 text-xs">
          {b.decisions.map(({ decision: d, feedback: f }, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${f.correct ? 'bg-emerald-500 text-ink-950' : 'bg-ruby-500 text-cream-50'}`}><Icon name={f.correct ? 'check' : 'x'} size={10} /></span>
              <span className="text-cream-200/80">
                {d.kind === 'insurance' ? 'Insurance offer' : describeHand(d.cards)}: you chose <b className="text-cream-50">{labelFor(d.action)}</b>
                {!f.correct && <> · best: <b className="text-gold-100">{labelFor(d.recommended)}</b></>}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-sm leading-relaxed text-cream-100/90">“{b.dealerSays}”</p>
      <p className="mt-2 text-sm font-medium text-gold-100">{b.lesson}</p>
    </article>
  )
}

export function labelFor(a: string): string {
  const map: Record<string, string> = {
    ...ACTION_LABEL,
    insurance: 'insurance', 'no-insurance': 'no insurance', 'even-money': 'even money', 'no-even-money': 'no even money',
  }
  return (map[a] ?? a).toLowerCase()
}
