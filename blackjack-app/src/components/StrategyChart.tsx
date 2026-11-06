import { useMemo, useState } from 'react'
import { parseCard, parseCards, type Card } from '../engine/cards'
import type { TableRules } from '../engine/rules'
import { chartFor, CODE_LABEL, recommend, upcardLabel, UPCARDS, type Code } from '../engine/strategy'
import { explainRecommendation } from '../engine/teaching'
import { Tabs } from './ui'

export const CODE_STYLE: Record<Code, string> = {
  H: 'bg-[#7d2a35] text-cream-50',
  S: 'bg-[#c9a24a] text-ink-950',
  D: 'bg-[#1d7a46] text-cream-50',
  Ds: 'bg-[#1d7a46] text-cream-50 [background-image:linear-gradient(135deg,transparent_55%,#c9a24a_55%)]',
  P: 'bg-[#3c4f9e] text-cream-50',
  Rh: 'bg-[#e6dccb] text-ink-950 [background-image:linear-gradient(135deg,transparent_55%,#7d2a35_55%)]',
  Rs: 'bg-[#e6dccb] text-ink-950 [background-image:linear-gradient(135deg,transparent_55%,#c9a24a_55%)]',
  Rp: 'bg-[#e6dccb] text-ink-950 [background-image:linear-gradient(135deg,transparent_55%,#3c4f9e_55%)]',
  '-': 'bg-ink-700 text-cream-300/50',
}

const SHORT: Record<Code, string> = { H: 'H', S: 'S', D: 'D', Ds: 'Ds', P: 'P', Rh: 'Rh', Rs: 'Rs', Rp: 'Rp', '-': '·' }

type Section = 'hard' | 'soft' | 'pairs'

function sampleCards(section: Section, key: number): Card[] {
  if (section === 'pairs') {
    const r = key === 11 ? 'A' : key === 10 ? 'K' : String(key)
    return parseCards(`${r}S ${r}H`)
  }
  if (section === 'soft') return parseCards(`AS ${key - 11}H`)
  const a = Math.min(10, key - 2)
  const b = key - a
  const map = (v: number) => (v === 10 ? 'K' : String(v))
  return a === b ? parseCards(`${map(a - 1)}S ${map(b + 1)}H`) : parseCards(`${map(a)}S ${map(b)}H`)
}

export function StrategyChart({ rules, highlight, compact = false }: { rules: TableRules; highlight?: string; compact?: boolean }) {
  const [section, setSection] = useState<Section>(() => (highlight?.startsWith('soft') ? 'soft' : highlight?.startsWith('pair') ? 'pairs' : 'hard'))
  const [picked, setPicked] = useState<{ section: Section; key: number; up: number } | null>(null)
  const chart = chartFor(rules)
  const rows = useMemo(() => {
    if (section === 'hard') return Array.from({ length: 13 }, (_, i) => i + 5).map((t) => ({ key: t, label: t === 17 ? '17+' : t <= 7 ? String(t) : String(t), row: chart.hard[t] }))
    if (section === 'soft') return Array.from({ length: 8 }, (_, i) => i + 13).map((t) => ({ key: t, label: `A,${t - 11}`, row: chart.soft[t] }))
    return [11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((p) => ({ key: p, label: p === 11 ? 'A,A' : p === 10 ? '10,10' : `${p},${p}`, row: chart.pairs[p] }))
  }, [section, chart])

  const explanation = useMemo(() => {
    if (!picked) return null
    const cards = sampleCards(picked.section, picked.key)
    const up = parseCard(picked.up === 11 ? 'AD' : picked.up === 10 ? 'KD' : `${picked.up}D`)
    const r = recommend(cards, up, rules, { canDouble: true, canSplit: picked.section === 'pairs', canSurrender: rules.lateSurrender })
    const code = picked.section === 'hard' ? chart.hard[picked.key][picked.up as 2] : picked.section === 'soft' ? chart.soft[picked.key][picked.up as 2] : chart.pairs[picked.key][picked.up as 2]
    return { code, text: explainRecommendation(cards, up, r, rules), title: `${picked.section === 'pairs' ? (picked.key === 11 ? 'A,A' : `${picked.key},${picked.key}`) : picked.section === 'soft' ? `Soft ${picked.key}` : `Hard ${picked.key}`} vs ${upcardLabel(picked.up)}` }
  }, [picked, rules, chart])

  const hl = highlight ? /^(hard|soft|pair)(\d+)v(\d+)$/.exec(highlight) : null

  return (
    <div>
      <Tabs
        tabs={[{ id: 'hard', label: 'Hard totals' }, { id: 'soft', label: 'Soft totals' }, { id: 'pairs', label: 'Pairs' }]}
        value={section}
        onChange={(s) => { setSection(s); setPicked(null) }}
        className="mb-3"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-separate border-spacing-[2px] text-center text-[11px] sm:text-xs">
          <thead>
            <tr>
              <th className="w-12 text-left text-[10px] font-semibold uppercase tracking-wider text-cream-300/50">You</th>
              {UPCARDS.map((u) => <th key={u} className="py-1 font-semibold text-gold-200">{upcardLabel(u)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, label, row }) => (
              <tr key={key}>
                <th scope="row" className="whitespace-nowrap pr-1 text-left font-semibold text-cream-100">{label}</th>
                {UPCARDS.map((u) => {
                  const code = row[u]
                  const kind = section === 'pairs' ? 'pair' : section
                  const isHl = hl && hl[1] === kind && Number(hl[2]) === key && Number(hl[3]) === u
                  const isPicked = picked && picked.key === key && picked.up === u && picked.section === section
                  return (
                    <td key={u} className="p-0">
                      <button
                        onClick={() => setPicked({ section, key, up: u })}
                        className={`flex h-7 w-full items-center justify-center rounded-[4px] font-bold sm:h-8 ${CODE_STYLE[code]} ${isHl ? 'ring-2 ring-white ring-offset-1 ring-offset-ink-900' : ''} ${isPicked ? 'outline outline-2 outline-gold-200' : ''}`}
                        aria-label={`${label} versus ${upcardLabel(u)}: ${CODE_LABEL[code]}`}
                      >
                        {SHORT[code]}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {explanation && (
        <div className="panel-soft fade-up mt-3 p-3.5 text-sm">
          <div className="mb-1 flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${CODE_STYLE[explanation.code]}`}>{SHORT[explanation.code]}</span>
            <span className="font-semibold text-cream-50">{explanation.title}: {CODE_LABEL[explanation.code]}</span>
          </div>
          <p className="text-cream-200/80">{explanation.text}</p>
        </div>
      )}
      {!compact && <Legend />}
    </div>
  )
}

export function Legend() {
  const codes: Code[] = ['H', 'S', 'D', 'Ds', 'P', 'Rh', 'Rs', 'Rp']
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-cream-300/70">
      {codes.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5">
          <span className={`inline-flex h-4 w-6 items-center justify-center rounded-[3px] text-[9px] font-bold ${CODE_STYLE[c]}`}>{SHORT[c]}</span>
          {CODE_LABEL[c]}
        </span>
      ))}
    </div>
  )
}
