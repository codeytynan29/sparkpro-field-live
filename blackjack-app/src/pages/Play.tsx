import { useState } from 'react'
import { CasinoTable } from '../components/CasinoTable'
import { Icon } from '../components/Icons'
import { RulesEditor } from '../components/RulesEditor'
import { PageHeader, Sheet } from '../components/ui'
import { VENUES } from '../content/dialogue'
import { describeRules, RULE_PRESETS } from '../engine/rules'
import type { Venue } from '../state/progress'
import { update, useProgress } from '../state/store'

const VENUE_ICON: Record<Venue, string> = { practice: 'learn', 'atlantic-city': 'hand', online: 'play' }
const VENUE_PRESET: Record<Venue, string | null> = { practice: null, 'atlantic-city': 'atlantic-city', online: 'online' }

export default function Play() {
  const p = useProgress()
  const [seated, setSeated] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const venue = p.settings.venue
  const rules = p.settings.rules

  const choose = (v: Venue) => {
    update((x) => {
      x.settings.venue = v
      const preset = VENUE_PRESET[v]
      if (preset && x.settings.presetId !== 'custom') {
        const pr = RULE_PRESETS.find((r) => r.id === preset)!
        x.settings.rules = { ...pr.rules, playerHands: x.settings.rules.playerHands }
        x.settings.presetId = pr.id
      }
    })
    setSeated(true)
  }

  if (seated) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <button className="btn-quiet -ml-2 px-2" onClick={() => setSeated(false)}><Icon name="back" size={16} /> Lobby</button>
          <button className="btn-quiet px-2 text-xs" onClick={() => setRulesOpen(true)}><Icon name="settings" size={14} /> Table rules</button>
        </div>
        <CasinoTable venue={venue} rules={rules} onExit={() => setSeated(false)} />
        <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader eyebrow="Casino simulator" title="Play Blackjack" subtitle="Pick a room. Every hand comes from a shuffled shoe, and the teaching dealer reviews every decision you make." />
      <div className="grid gap-3 md:grid-cols-3">
        {VENUES.map((v) => (
          <button key={v.id} onClick={() => choose(v.id)} className={`panel group flex flex-col items-start p-5 text-left transition hover:-translate-y-0.5 hover:border-gold-300/40 ${venue === v.id ? 'border-gold-300/40' : ''}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-felt-700 text-gold-100"><Icon name={VENUE_ICON[v.id]} size={22} /></span>
            <div className="mt-3 font-display text-xl text-cream-50">{v.name}</div>
            <p className="mt-1 text-sm text-cream-300/70">{v.blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-200">Take a seat <Icon name="arrow" size={16} className="transition group-hover:translate-x-1" /></span>
          </button>
        ))}
      </div>
      <div className="panel mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="label">Current table rules</div>
            <div className="mt-1 text-sm text-cream-100">{describeRules(rules).join(' · ')} · {rules.playerHands} hand{rules.playerHands > 1 ? 's' : ''} at once</div>
          </div>
          <button className="btn-ghost" onClick={() => setRulesOpen(true)}><Icon name="settings" size={16} /> Change rules</button>
        </div>
        <p className="mt-3 text-xs text-cream-300/55">Atlantic City and Online rooms load a matching rule preset unless you’ve set custom rules. Strategy feedback always follows the rules in play.</p>
      </div>
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  )
}

export function RulesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = useProgress()
  return (
    <Sheet open={open} onClose={onClose} title="Table rules" wide>
      <RulesEditor rules={p.settings.rules} presetId={p.settings.presetId} onChange={(r, id) => update((x) => { x.settings.rules = r; x.settings.presetId = id })} />
      <button className="btn-gold mt-5 w-full" onClick={onClose}>Done</button>
    </Sheet>
  )
}
