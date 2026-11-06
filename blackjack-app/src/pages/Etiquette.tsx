import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icons'
import { PageHeader, Tabs } from '../components/ui'
import { SignalDrill, SignalsDemo } from '../components/widgets/advanced'
import { ChipColors, TableLayout } from '../components/widgets/basics'
import { COMMON_MISTAKES } from '../content/reference'
import { useProgress } from '../state/store'
import { LevelCard } from './Learn'
import { update } from '../state/store'

const PROCEDURE = [
  { when: 'Walking up', do: 'Check the placard for the minimum bet and the felt for 3:2. Look for an empty seat with no chips in front of it.' },
  { when: 'Sitting down', do: 'Wait for the hand to finish. Lay cash flat on the felt, say “Change, please.” Never hand it over.' },
  { when: '“Place your bets”', do: 'Chips in the circle, biggest on the bottom. Then hands off.' },
  { when: '“Insurance?”', do: 'Do nothing to decline (or say “No insurance”). Wait for the dealer to check.' },
  { when: 'Your turn', do: 'The dealer points to your hand. Signal clearly: tap to hit, wave to stand, chips beside + one finger to double, chips + V to split.' },
  { when: 'Others’ turns', do: 'Wait. No advice unless asked, no touching, no early signals.' },
  { when: 'Getting paid', do: 'Let the dealer finish the whole table before you pick anything up.' },
  { when: 'Leaving', do: 'Between hands, push chips to the dealer: “Color up, please.” Tip if you like. Cash out at the cage.' },
]

export default function Etiquette() {
  const p = useProgress()
  const [style, setStyle] = useState<'face-up' | 'face-down'>('face-up')
  const [drillKey, setDrillKey] = useState(0)
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Level 2" title="Casino Etiquette" subtitle="How to physically sit, bet, signal and behave at a real table, so you look like a regular from the first hand." />
      <LevelCard n={2} unlocked={p.unlockedLevels.includes(2)} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl text-cream-50">Hand signals</h2>
            <Tabs value={style} onChange={(v) => { setStyle(v); setDrillKey((k) => k + 1) }} tabs={[{ id: 'face-up', label: 'Face-up (shoe)' }, { id: 'face-down', label: 'Face-down (pitch)' }]} />
          </div>
          <div className="mt-4"><SignalsDemo key={style} style={style} /></div>
        </div>
        <div className="panel p-5">
          <h2 className="font-display text-xl text-cream-50">Signal trainer</h2>
          <p className="mb-3 mt-1 text-sm text-cream-300/70">The dealer turns to you. Show the right signal. {p.signals.attempts > 0 && `So far: ${p.signals.correct}/${p.signals.attempts}.`}</p>
          <SignalDrill key={`${style}-${drillKey}`} style={style} count={8} />
          <button className="btn-quiet mt-2 px-2 py-1 text-xs" onClick={() => setDrillKey((k) => k + 1)}><Icon name="reset" size={14} /> New round</button>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-xl text-cream-50">A night at the table, step by step</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {PROCEDURE.map((s, i) => (
            <li key={s.when} className="flex gap-3 rounded-xl bg-ink-850 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">{i + 1}</span>
              <span><span className="block text-sm font-semibold text-cream-50">{s.when}</span><span className="block text-sm text-cream-200/75">{s.do}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="mb-3 font-display text-xl text-cream-50">The table</h2>
          <TableLayout />
        </div>
        <div className="panel p-5">
          <h2 className="mb-3 font-display text-xl text-cream-50">Chips</h2>
          <ChipColors />
          <h3 className="mt-5 font-display text-lg text-cream-50">Rookie mistakes</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {COMMON_MISTAKES.slice(9).concat([
              { mistake: 'Touching your cards in a face-up game', fix: 'Signal instead.' },
              { mistake: 'Handing cash to the dealer', fix: 'Lay it on the felt.' },
            ]).map((m) => <li key={m.mistake}><b className="text-cream-50">{m.mistake}.</b> <span className="text-cream-300/70">{m.fix}</span></li>)}
          </ul>
        </div>
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-xl text-cream-50">Try it on the Atlantic City floor</h2>
          <p className="text-sm text-cream-300/70">A live table with other players, where every action is a hand signal and the dealer narrates what they see.</p>
        </div>
        <Link to="/play" onClick={() => update((x) => { x.settings.venue = 'atlantic-city' })} className="btn-gold">Take a seat <Icon name="arrow" size={16} /></Link>
      </section>
    </div>
  )
}
