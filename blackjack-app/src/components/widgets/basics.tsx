import { useMemo, useState } from 'react'
import { cardPoints, parseCard, RANKS, SUITS, type Card, type Rank } from '../../engine/cards'
import { dealerShouldHit } from '../../engine/dealer'
import { bustChanceOnHit, dealerBustChance, pct } from '../../engine/ev'
import { handValue } from '../../engine/hand'
import { buildShoe } from '../../engine/cards'
import { createRng, pick, randomSeed } from '../../engine/rng'
import { useProgress } from '../../state/store'
import { CHIP_STYLE, Chip } from '../Chip'
import { PlayingCard } from '../PlayingCard'
import { Icon } from '../Icons'
import { Tabs } from '../ui'

export function CardValues() {
  const [sel, setSel] = useState<Rank | null>(null)
  const suits = ['S', 'H', 'D', 'C', 'S', 'H', 'D', 'C', 'S', 'H', 'D', 'C', 'S'] as const
  return (
    <div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
        {RANKS.map((r, i) => (
          <button key={r} onClick={() => setSel(r)} className={`rounded-lg transition ${sel === r ? 'ring-2 ring-gold-300 ring-offset-2 ring-offset-ink-900' : ''}`} aria-label={`Card ${r}`}>
            <PlayingCard card={{ rank: r, suit: suits[i] }} size="sm" />
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-[48px] rounded-xl bg-ink-850 px-4 py-3 text-sm" aria-live="polite">
        {sel == null ? <span className="text-cream-300/60">Tap a card.</span>
          : sel === 'A' ? <span><b className="text-cream-50">Ace: 1 or 11.</b> Counted as 11 unless that would put you over 21.</span>
            : ['J', 'Q', 'K'].includes(sel) ? <span><b className="text-cream-50">{sel === 'J' ? 'Jack' : sel === 'Q' ? 'Queen' : 'King'}: 10.</b> All face cards are worth 10.</span>
              : <span><b className="text-cream-50">{sel}: {cardPoints(sel)}.</b> Number cards are worth their number.</span>}
      </div>
    </div>
  )
}

export function HandBuilder() {
  const [cards, setCards] = useState<Card[]>([])
  const v = handValue(cards)
  const rng = useMemo(() => createRng(randomSeed()), [])
  return (
    <div>
      <div className="felt felt-rim flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-2xl p-4">
        <div className="flex -space-x-6">
          {cards.map((c, i) => <PlayingCard key={i} card={c} size="md" dealDelay={0} />)}
          {!cards.length && <span className="text-sm text-cream-200/60">Add cards below</span>}
        </div>
        {cards.length > 0 && (
          <div className={`rounded-full px-3 py-1 text-sm font-semibold ${v.bust ? 'bg-ruby-500 text-cream-50' : 'bg-ink-950/70 text-cream-50'}`} aria-live="polite">
            {v.bust ? `Bust: ${v.total}` : v.blackjack ? 'Blackjack! (21)' : `${v.soft ? 'Soft' : 'Hard'} ${v.total}`}
          </div>
        )}
      </div>
      {cards.length > 0 && !v.bust && (
        <p className="mt-2 text-xs text-cream-300/70">{v.soft ? 'Soft: an Ace is counted as 11. One more card can’t bust this hand.' : cards.some((c) => c.rank === 'A') ? 'Hard: the Ace has to count as 1 now.' : 'Hard: no Ace, so a big card can bust you.'}</p>
      )}
      <div className="mt-3 grid grid-cols-7 gap-1.5 sm:grid-cols-13">
        {RANKS.map((r) => (
          <button key={r} disabled={cards.length >= 7} onClick={() => setCards([...cards, { rank: r, suit: pick(rng, SUITS) }])} className="h-10 rounded-lg bg-ink-800 text-sm font-semibold text-cream-100 hover:bg-ink-700">{r}</button>
        ))}
      </div>
      <button className="btn-quiet mt-2 px-3 py-1.5 text-xs" onClick={() => setCards([])}><Icon name="reset" size={14} /> Clear</button>
    </div>
  )
}

function handLabel(cards: Card[]) {
  const v = handValue(cards)
  if (v.blackjack) return 'Blackjack'
  if (v.bust) return 'Bust'
  return `${v.soft ? 'Soft' : 'Hard'} ${v.total}`
}

export function TotalQuiz({ count = 6, onDone }: { count?: number; onDone?: (score: number) => void }) {
  const rng = useMemo(() => createRng(randomSeed()), [])
  const makeHand = () => {
    const n = rng.next() < 0.35 ? 3 : 2
    const withAce = rng.next() < 0.55
    const cards: Card[] = []
    if (withAce) cards.push({ rank: 'A', suit: pick(rng, SUITS) })
    while (cards.length < n) cards.push({ rank: pick(rng, RANKS.filter((r) => r !== 'A')), suit: pick(rng, SUITS) })
    return cards
  }
  const makeQ = () => {
    const cards = makeHand()
    const right = handLabel(cards)
    const v = handValue(cards)
    const opts = new Set([right])
    const alts: string[] = []
    const hasAce = cards.some((c) => c.rank === 'A')
    if (v.bust) alts.push(`Hard ${v.total - 10}`, 'Hard 21', `Hard ${Math.min(21, v.total - 2)}`)
    else if (v.soft) alts.push(`Hard ${v.total}`, `Hard ${v.total - 10}`, `Soft ${v.total - 1}`)
    else {
      if (hasAce && v.total + 10 <= 21) alts.push(`Soft ${v.total + 10}`)
      if (hasAce) alts.push(`Soft ${v.total}`)
      alts.push(`Hard ${v.total + 1}`, `Hard ${v.total - 1}`)
      if (v.total >= 17) alts.push('Bust')
    }
    const valid = (a: string) => a === 'Bust' || a === 'Blackjack' || (() => { const n = Number(a.split(' ')[1]); return n >= 4 && n <= 21 && !(a.startsWith('Soft') && n < 12) })()
    for (const a of alts) if (opts.size < 4 && valid(a)) opts.add(a)
    while (opts.size < 4) {
      const n = 12 + Math.floor(rng.next() * 10)
      opts.add(`${rng.next() < 0.5 ? 'Hard' : 'Soft'} ${n}`)
    }
    return { cards, right, options: [...opts].sort(() => rng.next() - 0.5) }
  }
  const [q, setQ] = useState(makeQ)
  const [n, setN] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  if (n >= count) {
    return <div className="rounded-xl bg-ink-850 p-4 text-center"><div className="font-display text-2xl text-cream-50">{score}/{count}</div><p className="text-sm text-cream-300/70">{score === count ? 'Perfect.' : 'Nice. Totals become automatic with practice.'}</p></div>
  }
  return (
    <div>
      <div className="mb-2 text-xs text-cream-300/60">{n + 1} of {count}</div>
      <div className="felt felt-rim flex justify-center rounded-2xl p-4">
        <div className="flex -space-x-6">{q.cards.map((c, i) => <PlayingCard key={i} card={c} size="md" />)}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {q.options.map((o) => (
          <button
            key={o}
            disabled={!!picked}
            onClick={() => { setPicked(o); if (o === q.right) setScore(score + 1) }}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${picked ? (o === q.right ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : o === picked ? 'border-ruby-400 bg-ruby-500/20 text-ruby-400' : 'border-white/5 text-cream-300/40') : 'border-white/10 bg-ink-850 text-cream-100 hover:border-gold-400/40'}`}
          >{o}</button>
        ))}
      </div>
      {picked && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm text-cream-200/80">{picked === q.right ? 'Correct.' : `It’s ${q.right}.`}</p>
          <button className="btn-gold px-4 py-2" onClick={() => { const nn = n + 1; setN(nn); setPicked(null); setQ(makeQ()); if (nn >= count) onDone?.(score) }}>Next</button>
        </div>
      )}
    </div>
  )
}

export function DealerPlay() {
  const [h17, setH17] = useState(false)
  const [seed, setSeed] = useState(0)
  const start = useMemo(() => {
    if (seed === 0) return { up: parseCard('AS'), hole: parseCard('6D'), draws: ['4C', '9H', '5S', 'KD', '3H'].map(parseCard) }
    const shoe = buildShoe(6, seed)
    return { up: shoe.cards[0], hole: shoe.cards[1], draws: shoe.cards.slice(2, 10) }
  }, [seed])
  const steps = useMemo(() => {
    const out: { cards: Card[]; note: string }[] = []
    let cards = [start.up, start.hole]
    let i = 0
    for (let guard = 0; guard < 10; guard++) {
      const v = handValue(cards)
      const hit = dealerShouldHit(cards, { dealerHitsSoft17: h17 })
      const label = `${v.soft ? 'soft ' : ''}${v.total}`
      if (v.bust) { out.push({ cards, note: `${v.total}: the dealer busts. Everyone still in wins.` }); break }
      if (v.blackjack) { out.push({ cards, note: 'Blackjack. The dealer would have found this when checking the hole card.' }); break }
      if (!hit) { out.push({ cards, note: `Dealer has ${label}. ${v.total === 17 && v.soft ? 'Soft 17, and this table stands on all 17s.' : '17 or more: the dealer must stand.'}` }); break }
      out.push({ cards, note: `Dealer has ${label}. ${v.total === 17 && v.soft ? 'Soft 17, and this table hits soft 17.' : 'Below 17: the dealer must hit.'}` })
      cards = [...cards, start.draws[i++]]
    }
    return out
  }, [start, h17])
  const [at, setAt] = useState(0)
  const cur = steps[Math.min(at, steps.length - 1)]
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs value={h17 ? 'h17' : 's17'} onChange={(v) => { setH17(v === 'h17'); setAt(0) }} tabs={[{ id: 's17', label: 'Stands on soft 17' }, { id: 'h17', label: 'Hits soft 17' }]} />
        <button className="btn-quiet px-3 py-1.5 text-xs" onClick={() => { setSeed(randomSeed()); setAt(0) }}><Icon name="reset" size={14} /> New hand</button>
      </div>
      <div className="felt felt-rim flex flex-col items-center gap-3 rounded-2xl p-4">
        <div className="flex -space-x-6">{cur.cards.map((c, i) => <PlayingCard key={`${seed}-${i}-${h17}`} card={c} size="md" dealDelay={i >= 2 ? 0 : null} />)}</div>
        <p className="text-center text-sm text-cream-50" aria-live="polite">{cur.note}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn-ghost flex-1" onClick={() => setAt(0)} disabled={at === 0}>Start over</button>
        <button className="btn-gold flex-1" onClick={() => setAt(at + 1)} disabled={at >= steps.length - 1}>Dealer’s next move</button>
      </div>
    </div>
  )
}

export function BustTable() {
  const p = useProgress()
  const [h17, setH17] = useState(p.settings.rules.dealerHitsSoft17)
  const ups = ['2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', 'KS', 'AS'].map(parseCard)
  const vals = ups.map((u) => dealerBustChance(u, h17))
  return (
    <div>
      <Tabs className="mb-3 w-fit" value={h17 ? 'h17' : 's17'} onChange={(v) => setH17(v === 'h17')} tabs={[{ id: 's17', label: 'S17' }, { id: 'h17', label: 'H17' }]} />
      <div className="space-y-1.5">
        {ups.map((u, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-8 font-semibold text-cream-100">{u.rank === 'K' ? '10' : u.rank}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-white/5">
              <div className={`h-full rounded ${i <= 4 ? 'bg-emerald-500/80' : 'bg-ruby-500/70'}`} style={{ width: `${vals[i] * 100 / 0.5}%` }} />
            </div>
            <span className="w-12 text-right tabular-nums text-cream-200">{pct(vals[i], 1)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-cream-300/50">Chance the dealer busts from each upcard, after checking for blackjack. Computed (infinite-deck model). Green = bust cards.</p>
    </div>
  )
}

export function PlayerBust() {
  const totals = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  const toCards = (t: number) => (t <= 11 ? [parseCard('5S'), parseCard(`${t - 5}H`)] : [parseCard('10S'), parseCard(`${t - 10 === 10 ? 'K' : t - 10}H`)])
  return (
    <div className="space-y-1.5">
      {totals.map((t) => {
        const b = bustChanceOnHit(toCards(t))
        return (
          <div key={t} className="flex items-center gap-2 text-sm">
            <span className="w-16 font-semibold text-cream-100">Hard {t}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-white/5"><div className="h-full rounded bg-ruby-500/75" style={{ width: `${b * 100}%` }} /></div>
            <span className="w-12 text-right tabular-nums text-cream-200">{pct(b)}</span>
          </div>
        )
      })}
      <p className="pt-1 text-[11px] text-cream-300/50">Chance the next card takes a hard total over 21. Ten-value cards are 4 in 13, so 12 busts on any ten (31%) and 16 busts on 6 or higher (62%).</p>
    </div>
  )
}

const LAYOUT_SPOTS = [
  { id: 'dealer', x: 200, y: 26, label: 'Dealer', text: 'Stands behind the table, deals, and runs the game. Always acts last.' },
  { id: 'shoe', x: 318, y: 48, label: 'Shoe', text: 'Holds the shuffled decks (usually 6 or 8 in Atlantic City). Cards are dealt from here.' },
  { id: 'tray', x: 82, y: 48, label: 'Discard tray', text: 'Used cards go here. Card counters glance at it to estimate how many decks are left.' },
  { id: 'chips', x: 200, y: 62, label: 'Chip tray', text: 'The house bank. Don’t touch it. Your chips are the ones in front of you.' },
  { id: 'placard', x: 278, y: 92, label: 'Placard', text: 'The table limits sign: minimum and maximum bet, sometimes the rules.' },
  { id: 'insurance', x: 200, y: 118, label: 'Insurance line', text: '“Insurance pays 2 to 1.” Insurance bets go on this line when offered.' },
  { id: 'first', x: 340, y: 170, label: 'First base', text: 'The seat on the dealer’s left. Acts first.' },
  { id: 'third', x: 60, y: 170, label: 'Third base', text: 'The seat on the dealer’s right. Acts last before the dealer.' },
  { id: 'circle', x: 200, y: 196, label: 'Betting circle', text: 'Your bet goes inside it before the deal. Hands off once cards are out.' },
]

export function TableLayout() {
  const [sel, setSel] = useState(LAYOUT_SPOTS[8])
  return (
    <div>
      <svg viewBox="0 0 400 240" className="w-full" role="img" aria-label="Blackjack table layout">
        <path d="M10 70 Q200 300 390 70 L390 40 Q200 70 10 40 Z" fill="#0e4630" stroke="#d4a63b" strokeOpacity=".6" strokeWidth="2" />
        <path d="M70 110 Q200 190 330 110" fill="none" stroke="#d4a63b" strokeOpacity=".7" strokeDasharray="4 4" />
        <text x="200" y="138" textAnchor="middle" fontSize="9" fill="#ead28c" opacity=".75" fontFamily="Inter Variable, sans-serif">INSURANCE PAYS 2 TO 1</text>
        <rect x="150" y="50" width="100" height="22" rx="4" fill="#062419" stroke="#d4a63b" strokeOpacity=".5" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={154 + i * 12} y="53" width="9" height="16" rx="2" fill={['#e9e4d8', '#b5262e', '#1d7a46', '#17181b'][i % 4]} />)}
        <rect x="296" y="36" width="44" height="26" rx="4" fill="#17181b" stroke="#d4a63b" strokeOpacity=".6" />
        <rect x="60" y="36" width="44" height="26" rx="4" fill="#17181b" stroke="#d4a63b" strokeOpacity=".4" />
        <rect x="264" y="84" width="30" height="16" rx="2" fill="#f3ead3" />
        {[0, 1, 2, 3, 4].map((i) => {
          const t = i / 4
          const x = 60 + t * 280
          const y = 170 + Math.sin(t * Math.PI) * 26
          return <ellipse key={i} cx={x} cy={y} rx="18" ry="11" fill="none" stroke="#f3ead3" strokeOpacity=".6" />
        })}
        {LAYOUT_SPOTS.map((s) => (
          <g key={s.id} onClick={() => setSel(s)} className="cursor-pointer" role="button" aria-label={s.label} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(s)}>
            <circle cx={s.x} cy={s.y} r="11" fill={sel.id === s.id ? '#d4a63b' : 'rgba(212,166,59,.25)'} stroke="#ead28c" />
            <text x={s.x} y={s.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill={sel.id === s.id ? '#07080a' : '#f4e7bf'}>{LAYOUT_SPOTS.indexOf(s) + 1}</text>
          </g>
        ))}
      </svg>
      <div className="mt-2 rounded-xl bg-ink-850 p-3 text-sm" aria-live="polite"><b className="text-cream-50">{sel.label}.</b> <span className="text-cream-200/80">{sel.text}</span></div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {LAYOUT_SPOTS.map((s, i) => <button key={s.id} className={`rounded-full px-2.5 py-1 text-xs ${sel.id === s.id ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`} onClick={() => setSel(s)}>{i + 1}. {s.label}</button>)}
      </div>
    </div>
  )
}

export function ChipColors() {
  const vals = [1, 5, 25, 100, 500, 1000]
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {vals.map((v) => (
        <div key={v} className="flex flex-col items-center gap-1 rounded-xl bg-ink-850 p-3">
          <Chip value={v} size={52} />
          <div className="text-sm font-semibold text-cream-50">${v.toLocaleString()}</div>
          <div className="text-[11px] text-cream-300/60">{CHIP_STYLE[v].name}</div>
        </div>
      ))}
    </div>
  )
}

const FLOW = [
  { t: 'Place your bet', d: 'Chips go in the betting circle before any cards are dealt.' },
  { t: 'The deal', d: 'One card to each player, one face up to the dealer, a second card to each player, then the dealer’s face-down hole card.' },
  { t: 'Insurance (only if the dealer shows an Ace)', d: 'The dealer offers insurance. Most of the time, decline.' },
  { t: 'The peek', d: 'With an Ace or ten up, the dealer checks the hole card. A dealer blackjack ends the round (your blackjack pushes it).' },
  { t: 'Players act', d: 'From first base to third base, each player hits, stands, doubles, splits or surrenders until finished. Busts lose immediately.' },
  { t: 'Dealer plays', d: 'The dealer reveals the hole card and draws by fixed rules: hit below 17, stand on 17+ (soft 17 depends on the table).' },
  { t: 'Settle', d: 'Winners paid 1:1, blackjacks 3:2 (or 6:5), pushes returned, losers collected.' },
]

export function RoundFlow() {
  const [i, setI] = useState(0)
  return (
    <div>
      <ol className="space-y-2">
        {FLOW.map((f, k) => (
          <li key={k}>
            <button onClick={() => setI(k)} className={`w-full rounded-xl border p-3 text-left transition ${k === i ? 'border-gold-300/50 bg-gold-400/10' : k < i ? 'border-white/5 bg-ink-850/60 opacity-70' : 'border-white/5 bg-ink-850'}`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${k <= i ? 'bg-gold-400 text-ink-950' : 'bg-ink-700 text-cream-300'}`}>{k + 1}</span>
                <span className="font-semibold text-cream-50">{f.t}</span>
              </div>
              {k === i && <p className="mt-1.5 pl-8 text-sm text-cream-200/80">{f.d}</p>}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex gap-2">
        <button className="btn-ghost flex-1" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        <button className="btn-gold flex-1" disabled={i >= FLOW.length - 1} onClick={() => setI(i + 1)}>Next step</button>
      </div>
    </div>
  )
}
