import { useMemo, useState } from 'react'
import { COMMON_MISTAKES, GLOSSARY, RULE_EFFECTS } from '../content/reference'
import { SIGNALS } from '../content/dialogue'
import { describeRules } from '../engine/rules'
import { ACTIONS, ACTION_LABEL } from '../engine/strategy'
import { useProgress } from '../state/store'
import { HandSignal } from './HandSignal'
import { StrategyChart } from './StrategyChart'
import { Sheet, Tabs } from './ui'
import { PayoutTable } from './PayoutTable'

type Tab = 'chart' | 'glossary' | 'signals' | 'payouts' | 'mistakes' | 'rules'

export function ReferencePanel({ initial = 'chart' }: { initial?: Tab }) {
  const p = useProgress()
  const [tab, setTab] = useState<Tab>(initial)
  const [q, setQ] = useState('')
  const [faceDown, setFaceDown] = useState(false)
  const rules = p.settings.rules
  const gloss = useMemo(() => GLOSSARY.filter((g) => !q || (g.term + ' ' + g.def).toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <div>
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'chart', label: 'Strategy chart' },
          { id: 'signals', label: 'Hand signals' },
          { id: 'payouts', label: 'Payouts' },
          { id: 'glossary', label: 'Glossary' },
          { id: 'mistakes', label: 'Mistakes' },
          { id: 'rules', label: 'Rule effects' },
        ]}
      />
      {tab === 'chart' && (
        <div>
          <p className="mb-3 text-xs text-cream-300/60">For your current table: {describeRules(rules).slice(0, 5).join(' · ')}. Tap any cell for the reasoning.</p>
          <StrategyChart rules={rules} />
        </div>
      )}
      {tab === 'signals' && (
        <div>
          <Tabs className="mb-3 w-fit" value={faceDown ? 'down' : 'up'} onChange={(v) => setFaceDown(v === 'down')} tabs={[{ id: 'up', label: 'Face-up shoe game' }, { id: 'down', label: 'Face-down pitch game' }]} />
          <div className="grid gap-3 sm:grid-cols-2">
            {ACTIONS.map((a) => (
              <div key={a} className="panel-soft flex items-center gap-3 p-3">
                <HandSignal action={a} faceDown={faceDown} size={120} />
                <div className="min-w-0">
                  <div className="font-semibold text-cream-50">{ACTION_LABEL[a]}</div>
                  <p className="text-xs text-cream-200/75">{faceDown ? SIGNALS[a].faceDown : SIGNALS[a].faceUp}</p>
                  <p className="mt-1 text-[11px] text-cream-300/55">Say: {SIGNALS[a].verbal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'payouts' && <PayoutTable />}
      {tab === 'glossary' && (
        <div>
          <input className="input mb-3" placeholder="Search terms…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search glossary" />
          <dl className="divide-y divide-white/5">
            {gloss.map((g) => (
              <div key={g.term} className="py-2.5">
                <dt className="font-semibold text-cream-50">{g.term}</dt>
                <dd className="text-sm text-cream-200/75">{g.def}</dd>
              </div>
            ))}
            {!gloss.length && <p className="py-6 text-center text-sm text-cream-300/60">No matching terms.</p>}
          </dl>
        </div>
      )}
      {tab === 'mistakes' && (
        <ul className="space-y-2">
          {COMMON_MISTAKES.map((m) => (
            <li key={m.mistake} className="panel-soft p-3">
              <div className="text-sm font-semibold text-ruby-400">{m.mistake}</div>
              <div className="text-sm text-cream-200/80">{m.fix}</div>
            </li>
          ))}
        </ul>
      )}
      {tab === 'rules' && (
        <div>
          <p className="mb-3 text-xs text-cream-300/60">How common rule changes affect the player. See Learn → Level 6 → House Edge for the computed numbers.</p>
          <ul className="divide-y divide-white/5">
            {RULE_EFFECTS.map((r) => (
              <li key={r.rule} className="flex items-start justify-between gap-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-cream-50">{r.rule}</div>
                  <div className="text-xs text-cream-300/60">{r.note}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.effect.startsWith('Better') ? 'bg-emerald-500/20 text-emerald-300' : r.effect.startsWith('Neutral') ? 'bg-white/10 text-cream-200' : 'bg-ruby-500/20 text-ruby-400'}`}>{r.effect}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ReferenceDrawer({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Tab }) {
  return (
    <Sheet open={open} onClose={onClose} title="Reference" wide>
      <ReferencePanel initial={initial} />
    </Sheet>
  )
}
