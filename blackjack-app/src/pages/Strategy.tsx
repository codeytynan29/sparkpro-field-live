import { useState } from 'react'
import { ReferencePanel } from '../components/ReferenceDrawer'
import { RulesEditor } from '../components/RulesEditor'
import { StrategyChart } from '../components/StrategyChart'
import { PageHeader, Sheet } from '../components/ui'
import { EvCompare } from '../components/widgets/advanced'
import { Icon } from '../components/Icons'
import { describeRules } from '../engine/rules'
import { update, useProgress } from '../state/store'
import { Link } from 'react-router-dom'

const EXAMPLES = [
  { title: 'Doubling 11 against a 6', cards: '6S 5H', up: '6D', note: 'One of the strongest doubles in the game: the dealer is weak and you’re likely to draw a ten.' },
  { title: 'Splitting 8s against a 10', cards: '8S 8H', up: 'KD', note: 'Both choices lose money. Splitting loses less than playing a 16.' },
  { title: 'Hard 16 against a 10', cards: '10S 6H', up: 'KD', note: 'Surrender if you can. If not, hitting is slightly better than standing.' },
  { title: 'Soft 18 against a 9', cards: 'AS 7H', up: '9D', note: 'Feels like a stand. The numbers say hit.' },
  { title: 'Never split tens', cards: 'KS QH', up: '6D', note: '20 against a 6 is already a big favorite. Splitting gives that up.' },
  { title: 'Hard 12 against a 3', cards: '10S 2H', up: '3D', note: 'A near coin-flip that still favors hitting.' },
]

export default function Strategy() {
  const p = useProgress()
  const [rulesOpen, setRulesOpen] = useState(false)
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Level 5 · Reference" title="Strategy" subtitle="The complete basic strategy chart for your table rules, plus every reference you need during play." right={<Link to="/practice" className="btn-ghost"><Icon name="practice" size={16} /> Drill it</Link>} />
      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="label">Chart for</div>
            <div className="text-sm text-cream-100">{describeRules(p.settings.rules).slice(0, 6).join(' · ')}</div>
          </div>
          <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setRulesOpen(true)}><Icon name="settings" size={16} /> Change rules</button>
        </div>
        <StrategyChart rules={p.settings.rules} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl text-cream-50">Worked examples</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((e) => (
            <div key={e.title} className="panel p-4">
              <div className="font-semibold text-cream-50">{e.title}</div>
              <p className="mb-3 mt-0.5 text-xs text-cream-300/70">{e.note}</p>
              <EvCompare cards={e.cards} up={e.up} />
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 font-display text-2xl text-cream-50">Reference library</h2>
        <ReferencePanel initial="payouts" />
      </section>

      <Sheet open={rulesOpen} onClose={() => setRulesOpen(false)} title="Table rules" wide>
        <RulesEditor rules={p.settings.rules} presetId={p.settings.presetId} onChange={(r, id) => update((x) => { x.settings.rules = r; x.settings.presetId = id })} />
        <button className="btn-gold mt-5 w-full" onClick={() => setRulesOpen(false)}>Done</button>
      </Sheet>
    </div>
  )
}
