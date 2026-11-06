import { useState } from 'react'
import { CasinoTable } from '../components/CasinoTable'
import { Icon } from '../components/Icons'
import { PageHeader, Tabs } from '../components/ui'
import { CountDrill, DeckEstimation, IndexPlays, TcDrill } from '../components/widgets/advanced'
import { sanitizeRules } from '../engine/rules'
import { accuracy } from '../state/progress'
import { useProgress } from '../state/store'
import { LevelCard } from './Learn'

type Drill = 'values' | 'stream' | 'deck' | 'tc' | 'tray' | 'table'

export default function Counting() {
  const p = useProgress()
  const [drill, setDrill] = useState<Drill>('values')
  const [key, setKey] = useState(0)
  const unlocked = p.unlockedLevels.includes(7)
  const rc = accuracy({ total: p.counting.rcAttempts, correct: p.counting.rcCorrect })
  const tc = accuracy({ total: p.counting.tcAttempts, correct: p.counting.tcCorrect })
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Level 7" title="Card Counting" subtitle="Hi-Lo, from single cards to a live shoe. Counting shifts the long-run average a little. It never guarantees a win." />
      <LevelCard n={7} unlocked={unlocked} />

      <section className="grid grid-cols-3 gap-2">
        <div className="panel-soft p-3"><div className="label">Running count</div><div className="mt-1 text-xl font-semibold text-cream-50">{rc == null ? '—' : `${Math.round(rc * 100)}%`}</div><div className="text-xs text-cream-300/60">{p.counting.rcAttempts} checks</div></div>
        <div className="panel-soft p-3"><div className="label">True count</div><div className="mt-1 text-xl font-semibold text-cream-50">{tc == null ? '—' : `${Math.round(tc * 100)}%`}</div><div className="text-xs text-cream-300/60">{p.counting.tcAttempts} conversions</div></div>
        <div className="panel-soft p-3"><div className="label">Best deck</div><div className="mt-1 text-xl font-semibold text-cream-50">{p.counting.bestDeckMs ? `${(p.counting.bestDeckMs / 1000).toFixed(1)}s` : '—'}</div><div className="text-xs text-cream-300/60">{p.counting.decksCounted} decks counted</div></div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-xl text-cream-50">Counting drills</h2>
        <Tabs
          className="my-4"
          value={drill}
          onChange={(d) => { setDrill(d); setKey((k) => k + 1) }}
          tabs={[
            { id: 'values', label: 'Card values' },
            { id: 'stream', label: 'Running count' },
            { id: 'deck', label: 'Full deck' },
            { id: 'tc', label: 'True count' },
            { id: 'tray', label: 'Discard tray' },
            { id: 'table', label: 'Count at the table' },
          ]}
        />
        <div key={key}>
          {drill === 'values' && <CountDrill mode="values" count={26} />}
          {drill === 'stream' && <CountDrill mode="stream" count={15} />}
          {drill === 'deck' && <CountDrill mode="deck" />}
          {drill === 'tc' && <TcDrill count={10} />}
          {drill === 'tray' && <DeckEstimation count={8} />}
          {drill === 'table' && (
            <div>
              <p className="mb-3 text-sm text-cream-300/70">Play a real 6-deck shoe. Every couple of hands the dealer asks for your running count. Start from 0 at the shuffle, and count the hole card when it’s turned over.</p>
              <CasinoTable venue="practice" rules={sanitizeRules({ ...p.settings.rules, decks: 6 })} countQuiz />
            </div>
          )}
        </div>
        {drill !== 'table' && <button className="btn-quiet mt-3 px-2 py-1 text-xs" onClick={() => setKey((k) => k + 1)}><Icon name="reset" size={14} /> Restart drill</button>}
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 font-display text-xl text-cream-50">Index plays: the Illustrious 18</h2>
        <IndexPlays />
      </section>

      <section className="panel p-5 text-sm text-cream-200/80">
        <h2 className="mb-2 font-display text-xl text-cream-50">The fine print</h2>
        <p>Counting cards in your head is legal. Using any device to help is illegal in casino jurisdictions. Casinos can take countermeasures: shuffling early, limiting your bets, or (outside New Jersey) asking you to leave the blackjack tables.</p>
        <p className="mt-2">Even a skilled counter’s edge is small, around half a percent to one percent, and the swings are large. Learn it to understand the game, not as a plan to make money.</p>
      </section>
    </div>
  )
}
