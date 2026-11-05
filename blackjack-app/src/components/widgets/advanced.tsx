import { useEffect, useMemo, useRef, useState } from 'react'
import { parseCard, parseCards, SUITS, type Card } from '../../engine/cards'
import { hiLo, ILLUSTRIOUS_18, trueCountForPlay } from '../../engine/count'
import { nextSituation, type DrillCategory } from '../../engine/drills'
import { formatEV, insuranceEV, pct, playerExpectation, removalEffects } from '../../engine/ev'
import { createRng, pick, randomSeed } from '../../engine/rng'
import { buildShoe } from '../../engine/cards'
import { sanitizeRules, type TableRules } from '../../engine/rules'
import { mean, riskOfRuin, sessions, simulate, stdev } from '../../engine/sim'
import { perfectPairs, twentyOnePlusThree, TWENTY_ONE_PLUS_THREE_TABLES } from '../../engine/sidebets'
import { ACTION_LABEL, ACTIONS, type Action } from '../../engine/strategy'
import { evTable } from '../../engine/teaching'
import { SIGNALS } from '../../content/dialogue'
import { recordCount, recordSignal } from '../../state/progress'
import { update, useProgress } from '../../state/store'
import { HandSignal } from '../HandSignal'
import { Icon } from '../Icons'
import { PlayingCard } from '../PlayingCard'
import { StrategyChart } from '../StrategyChart'
import { EvBars } from '../Teaching'
import { DecisionTrainer, SituationView } from '../Trainer'
import { Tabs, Toggle } from '../ui'
import { money } from '../Chip'

export function SignalsDemo({ style = 'face-up' }: { style?: 'face-up' | 'face-down' }) {
  const [sel, setSel] = useState<Action>('hit')
  const fd = style === 'face-down'
  return (
    <div>
      <div className="flex justify-center rounded-2xl bg-ink-850 p-3"><HandSignal action={sel} faceDown={fd} size={260} /></div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {ACTIONS.map((a) => (
          <button key={a} onClick={() => setSel(a)} className={`rounded-lg px-1 py-2 text-xs font-semibold ${sel === a ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{ACTION_LABEL[a].replace(' down', '')}</button>
        ))}
      </div>
      <p className="mt-3 text-sm text-cream-100" aria-live="polite"><b>{ACTION_LABEL[sel]}:</b> {fd ? SIGNALS[sel].faceDown : SIGNALS[sel].faceUp}</p>
      <p className="mt-1 text-xs text-cream-300/60">Say it too: {SIGNALS[sel].verbal}</p>
    </div>
  )
}

export function SignalDrill({ style = 'face-up', count = 6, onDone }: { style?: 'face-up' | 'face-down'; count?: number; onDone?: (score: number) => void }) {
  const p = useProgress()
  const rng = useMemo(() => createRng(randomSeed()), [])
  const fd = style === 'face-down'
  const rules = useMemo(() => sanitizeRules({ ...p.settings.rules, lateSurrender: true }), [p.settings.rules])
  const cats: DrillCategory[] = ['hard', 'soft', 'pair', 'double', 'surrender']
  const make = () => {
    const s = nextSituation(pick(rng, cats), rules, rng)
    const wrong = ACTIONS.filter((a) => a !== s.rec.action)
    const opts = [s.rec.action, ...wrong.sort(() => rng.next() - 0.5).slice(0, 3)].sort(() => rng.next() - 0.5)
    return { s, opts }
  }
  const [q, setQ] = useState(make)
  const [n, setN] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<Action | null>(null)
  if (n >= count) return <div className="rounded-xl bg-ink-850 p-4 text-center"><div className="font-display text-2xl text-cream-50">{score}/{count}</div><p className="text-sm text-cream-300/70">{score === count ? 'The dealer understood every signal.' : 'Keep practicing. Clear signals keep the game smooth.'}</p></div>
  return (
    <div>
      <div className="mb-2 text-xs text-cream-300/60">{n + 1} of {count}</div>
      <SituationView s={q.s} size="md" />
      <p className="mt-3 text-sm text-cream-100">The dealer looks at you. Basic strategy says <b className="text-gold-100">{ACTION_LABEL[q.s.rec.action].toLowerCase()}</b>. Show it:</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {q.opts.map((a) => (
          <button
            key={a}
            disabled={!!picked}
            onClick={() => {
              setPicked(a)
              const ok = a === q.s.rec.action
              if (ok) setScore(score + 1)
              update((pp, c) => recordSignal(pp, c, ok))
            }}
            className={`flex justify-center rounded-xl border p-1.5 transition ${picked ? (a === q.s.rec.action ? 'border-emerald-400 bg-emerald-500/15' : a === picked ? 'border-ruby-400 bg-ruby-500/15' : 'border-white/5 opacity-40') : 'border-white/10 bg-ink-850 hover:border-gold-400/40'}`}
            aria-label={`Signal option ${q.opts.indexOf(a) + 1}`}
          >
            <HandSignal action={a} faceDown={fd} size={140} animate={!picked} />
          </button>
        ))}
      </div>
      {picked && (
        <div className="mt-3">
          <p className={`text-sm font-semibold ${picked === q.s.rec.action ? 'text-emerald-300' : 'text-ruby-400'}`}>{picked === q.s.rec.action ? 'Clear signal. The dealer knows exactly what you want.' : `That signal means “${ACTION_LABEL[picked].toLowerCase()}.”`}</p>
          <p className="mt-1 text-sm text-cream-200/80">{ACTION_LABEL[q.s.rec.action]}: {fd ? SIGNALS[q.s.rec.action].faceDown : SIGNALS[q.s.rec.action].faceUp}</p>
          <button className="btn-gold mt-3 w-full" onClick={() => { const nn = n + 1; setN(nn); setPicked(null); setQ(make()); if (nn >= count) onDone?.(score) }}>Next</button>
        </div>
      )}
    </div>
  )
}

export function EvCompare({ cards = '10S 6H', up = 'KD' }: { cards?: string; up?: string }) {
  const p = useProgress()
  const c = parseCards(cards)
  const u = parseCard(up)
  const allowed: Action[] = ['hit', 'stand', 'double', 'surrender']
  if (c.length === 2 && c[0].rank === c[1].rank) allowed.push('split')
  const rows = evTable(c, u, p.settings.rules, allowed)
  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-4 rounded-2xl bg-felt-800/60 p-3">
        <div className="flex -space-x-5">{c.map((x, i) => <PlayingCard key={i} card={x} size="sm" />)}</div>
        <span className="text-xs uppercase tracking-wider text-gold-200/60">vs</span>
        <PlayingCard card={u} size="sm" />
      </div>
      <EvBars rows={rows} />
    </div>
  )
}

export function InsuranceMath() {
  const [tens, setTens] = useState(16)
  const total = 52
  const ev = insuranceEV(tens, total)
  return (
    <div>
      <label className="block text-sm text-cream-100">
        Ten-value cards left in a deck of {total}: <b className="text-gold-100">{tens}</b> ({pct(tens / total)})
        <input type="range" min={8} max={26} value={tens} onChange={(e) => setTens(Number(e.target.value))} className="mt-2 w-full accent-[#d4a63b]" aria-label="Ten-value cards remaining" />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-ink-850 p-3"><div className="label">Insurance wins</div><div className="mt-1 text-xl font-semibold text-cream-50">{pct(tens / total, 1)}</div></div>
        <div className={`rounded-xl p-3 ${ev >= 0 ? 'bg-emerald-500/15' : 'bg-ruby-500/15'}`}><div className="label">Value per $1 insured</div><div className={`mt-1 text-xl font-semibold ${ev >= 0 ? 'text-emerald-300' : 'text-ruby-400'}`}>{formatEV(ev)}</div></div>
      </div>
      <p className="mt-2 text-xs text-cream-300/60">A fresh deck has 16 tens in 52 cards. Insurance only breaks even when exactly one third of the unseen cards are tens. That is the situation a high Hi-Lo count signals.</p>
    </div>
  )
}

export function PayoutCalc({ mode }: { mode?: 'blackjack' }) {
  const [bet, setBet] = useState(25)
  if (mode === 'blackjack') {
    const per21 = bet * 0.3
    return (
      <div>
        <label className="flex items-center gap-3 text-sm text-cream-100">Bet per hand <input className="input w-24" type="number" inputMode="numeric" min={1} value={bet} onChange={(e) => setBet(Math.max(1, Number(e.target.value) || 1))} /></label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-emerald-500/15 p-3"><div className="label">3:2 blackjack pays</div><div className="mt-1 text-xl font-semibold text-emerald-300">{money(bet * 1.5)}</div></div>
          <div className="rounded-xl bg-ruby-500/15 p-3"><div className="label">6:5 blackjack pays</div><div className="mt-1 text-xl font-semibold text-ruby-400">{money(bet * 1.2)}</div></div>
        </div>
        <p className="mt-2 text-sm text-cream-200/80">You lose {money(per21)} every time you hit a blackjack at 6:5. At about one blackjack every 21 hands and 70 hands an hour, that’s roughly {money(per21 * (70 / 21))} an hour in reduced payouts.</p>
      </div>
    )
  }
  const ins = bet / 2
  return (
    <div>
      <label className="flex items-center gap-3 text-sm text-cream-100">Your bet <input className="input w-24" type="number" inputMode="numeric" min={2} value={bet} onChange={(e) => setBet(Math.max(2, Number(e.target.value) || 2))} /></label>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-ink-850 p-3 text-sm">
          <div className="label mb-1">Dealer has blackjack</div>
          <div className="flex justify-between"><span>Main bet loses</span><span className="text-ruby-400">{money(-bet, true)}</span></div>
          <div className="flex justify-between"><span>Insurance pays 2:1</span><span className="text-emerald-300">{money(ins * 2, true)}</span></div>
          <div className="mt-1 flex justify-between border-t border-white/10 pt-1 font-semibold"><span>Net</span><span>{money(0, true)}</span></div>
        </div>
        <div className="rounded-xl bg-ink-850 p-3 text-sm">
          <div className="label mb-1">Dealer has no blackjack</div>
          <div className="flex justify-between"><span>Insurance lost</span><span className="text-ruby-400">{money(-ins, true)}</span></div>
          <div className="flex justify-between"><span>Main hand</span><span className="text-cream-300/70">plays out normally</span></div>
        </div>
      </div>
    </div>
  )
}

export function HouseEdge() {
  const p = useProgress()
  const [r, setR] = useState<TableRules>(() => ({ ...p.settings.rules }))
  const ev = useMemo(() => playerExpectation(r), [r])
  const edge = -ev
  const perHour = edge * 25 * 70
  return (
    <div>
      <div className="divide-y divide-white/5">
        <Toggle label="Dealer hits soft 17" checked={r.dealerHitsSoft17} onChange={(v) => setR({ ...r, dealerHitsSoft17: v })} />
        <Toggle label="Double after split" checked={r.doubleAfterSplit} onChange={(v) => setR({ ...r, doubleAfterSplit: v })} />
        <Toggle label="Late surrender" checked={r.lateSurrender} onChange={(v) => setR({ ...r, lateSurrender: v })} />
        <Toggle label="Blackjack pays 6:5" checked={r.blackjackPayout === '6:5'} onChange={(v) => setR({ ...r, blackjackPayout: v ? '6:5' : '3:2' })} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-ink-850 p-3"><div className="label">House edge</div><div className="mt-1 text-2xl font-semibold text-cream-50">{(edge * 100).toFixed(2)}%</div></div>
        <div className="rounded-xl bg-ink-850 p-3"><div className="label">Average cost</div><div className="mt-1 text-2xl font-semibold text-cream-50">{money(Math.round(perHour * 100) / 100)}<span className="text-sm text-cream-300/60">/hr</span></div><div className="text-[11px] text-cream-300/50">$25 a hand, 70 hands an hour</div></div>
      </div>
      <p className="mt-2 text-[11px] text-cream-300/50">Computed by this app’s own calculator: every starting hand against every dealer upcard, perfect basic strategy, infinite-deck model with one split per hand. Real 6–8 deck games with resplits run slightly lower; fewer decks lower it further.</p>
    </div>
  )
}

function Histogram({ values, bins = 15 }: { values: number[]; bins?: number }) {
  if (!values.length) return null
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const w = (hi - lo) / bins || 1
  const counts = Array(bins).fill(0)
  for (const v of values) counts[Math.min(bins - 1, Math.floor((v - lo) / w))]++
  const max = Math.max(...counts)
  return (
    <svg viewBox={`0 0 ${bins * 20} 110`} className="w-full" role="img" aria-label="Distribution of session results">
      {counts.map((c, i) => {
        const x0 = lo + i * w
        const h = (c / max) * 90
        return <rect key={i} x={i * 20 + 2} y={95 - h} width="16" height={h} rx="2" fill={x0 + w / 2 >= 0 ? '#34d399' : '#c43a4f'} opacity=".85" />
      })}
      <line x1="0" y1="95.5" x2={bins * 20} y2="95.5" stroke="rgba(255,255,255,.2)" />
      <text x="0" y="108" fontSize="8" fill="#e6d9b8">{lo.toFixed(0)} units</text>
      <text x={bins * 20} y="108" fontSize="8" fill="#e6d9b8" textAnchor="end">+{hi.toFixed(0)} units</text>
    </svg>
  )
}

export function VarianceSim() {
  const p = useProgress()
  const [seed, setSeed] = useState(() => randomSeed())
  const res = useMemo(() => {
    const r = simulate(p.settings.rules, 10000, seed)
    const s = sessions(r.nets, 100)
    return { r, s }
  }, [seed, p.settings.rules])
  const won = res.s.filter((x) => x > 0).length
  return (
    <div>
      <Histogram values={res.s} />
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="rounded-xl bg-ink-850 p-2.5"><div className="label">Winning sessions</div><div className="font-semibold text-cream-50">{won} of {res.s.length}</div></div>
        <div className="rounded-xl bg-ink-850 p-2.5"><div className="label">Best</div><div className="font-semibold text-emerald-300">+{Math.max(...res.s).toFixed(1)} u</div></div>
        <div className="rounded-xl bg-ink-850 p-2.5"><div className="label">Worst</div><div className="font-semibold text-ruby-400">{Math.min(...res.s).toFixed(1)} u</div></div>
        <div className="rounded-xl bg-ink-850 p-2.5"><div className="label">Per hand</div><div className="font-semibold text-cream-50">avg {formatEV(mean(res.r.nets))}, sd {stdev(res.r.nets).toFixed(2)}</div></div>
      </div>
      <p className="mt-2 text-xs text-cream-300/60">Every one of these sessions used perfect basic strategy. Some won big, some lost big. Over only 100 hands, the result is mostly luck. ({res.r.hands.toLocaleString()} simulated hands, your table rules.)</p>
      <button className="btn-ghost mt-2 px-3 py-1.5 text-xs" onClick={() => setSeed(randomSeed())}><Icon name="reset" size={14} /> Simulate again</button>
    </div>
  )
}

export function RuinSim() {
  const p = useProgress()
  const [units, setUnits] = useState(20)
  const [hands, setHands] = useState(300)
  const [result, setResult] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    setRunning(true)
    const t = setTimeout(() => {
      const trips = 200
      const r = simulate(p.settings.rules, trips * hands, units * 7919 + hands)
      setResult(riskOfRuin(r.nets, units, hands))
      setRunning(false)
    }, 60)
    return () => clearTimeout(t)
  }, [units, hands, p.settings.rules])
  return (
    <div>
      <label className="block text-sm text-cream-100">Bankroll: <b className="text-gold-100">{units} betting units</b> (e.g. {money(units * 25)} at $25 a hand)
        <input type="range" min={5} max={100} step={5} value={units} onChange={(e) => setUnits(Number(e.target.value))} className="mt-1 w-full accent-[#d4a63b]" aria-label="Bankroll in units" />
      </label>
      <label className="mt-2 block text-sm text-cream-100">Trip length: <b className="text-gold-100">{hands} hands</b> (about {Math.round(hands / 70)} hours)
        <input type="range" min={100} max={1000} step={100} value={hands} onChange={(e) => setHands(Number(e.target.value))} className="mt-1 w-full accent-[#d4a63b]" aria-label="Hands played" />
      </label>
      <div className="mt-3 rounded-xl bg-ink-850 p-4 text-center">
        <div className="label">Chance of losing the whole bankroll</div>
        <div className="mt-1 font-display text-4xl text-cream-50">{result == null || running ? '…' : pct(result)}</div>
        <div className="mt-1 text-xs text-cream-300/60">200 simulated trips with perfect basic strategy, flat betting.</div>
      </div>
    </div>
  )
}

type CountMode = 'values' | 'stream' | 'deck'

export function CountDrill({ mode = 'values', count = 20, onDone }: { mode?: CountMode; count?: number; onDone?: (ok: boolean) => void }) {
  const rng = useMemo(() => createRng(randomSeed()), [])
  if (mode === 'values') return <ValueDrill count={count} onDone={onDone} rngSeed={rng.state()} />
  return <StreamDrill deck={mode === 'deck'} count={count} onDone={onDone} />
}

function randomCard(rng: ReturnType<typeof createRng>): Card {
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
  return { rank: pick(rng, ranks), suit: pick(rng, SUITS) }
}

function ValueDrill({ count, onDone, rngSeed }: { count: number; onDone?: (ok: boolean) => void; rngSeed: number }) {
  const rng = useMemo(() => createRng(rngSeed), [rngSeed])
  const [card, setCard] = useState(() => randomCard(rng))
  const [n, setN] = useState(0)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<null | boolean>(null)
  const [t0] = useState(() => performance.now())
  const [elapsed, setElapsed] = useState(0)
  if (n >= count) {
    return <div className="rounded-xl bg-ink-850 p-4 text-center"><div className="font-display text-2xl text-cream-50">{score}/{count}</div><p className="text-sm text-cream-300/70">{(elapsed / 1000 / count).toFixed(2)}s per card. Pros aim for well under half a second.</p></div>
  }
  const answer = (v: number) => {
    const ok = v === hiLo(card)
    setFlash(ok)
    if (ok) setScore(score + 1)
    setTimeout(() => {
      setFlash(null)
      const nn = n + 1
      setN(nn)
      setCard(randomCard(rng))
      if (nn >= count) { setElapsed(performance.now() - t0); onDone?.(score + (ok ? 1 : 0) >= count * 0.8) }
    }, ok ? 180 : 700)
  }
  return (
    <div>
      <div className="mb-2 text-xs text-cream-300/60">{n + 1} of {count} · {score} right</div>
      <div className={`flex justify-center rounded-2xl p-4 transition ${flash === true ? 'bg-emerald-500/20' : flash === false ? 'bg-ruby-500/20' : 'bg-felt-800/60'}`}>
        <PlayingCard key={n} card={card} size="lg" dealDelay={0} />
      </div>
      {flash === false && <p className="mt-2 text-center text-sm text-ruby-400">{card.rank} counts {hiLo(card) > 0 ? '+1' : hiLo(card) < 0 ? '−1' : '0'}</p>}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[1, 0, -1].map((v) => <button key={v} disabled={flash !== null} onClick={() => answer(v)} className="btn-felt py-3 text-lg">{v > 0 ? '+1' : v < 0 ? '−1' : '0'}</button>)}
      </div>
    </div>
  )
}

function StreamDrill({ deck, count, onDone }: { deck: boolean; count: number; onDone?: (ok: boolean) => void }) {
  const [speed, setSpeed] = useState(900)
  const [phase, setPhase] = useState<'ready' | 'run' | 'ask' | 'done'>('ready')
  const [seed, setSeed] = useState(() => randomSeed())
  const cards = useMemo(() => buildShoe(1, seed).cards.slice(0, deck ? 52 : count), [seed, deck, count])
  const shown = deck ? cards.slice(0, 51) : cards
  const answer = shown.reduce((a, c) => a + hiLo(c), 0)
  const [i, setI] = useState(0)
  const [guess, setGuess] = useState('')
  const t0 = useRef(0)
  const [ms, setMs] = useState(0)
  useEffect(() => {
    if (phase !== 'run' || deck) return
    if (i >= shown.length) { setPhase('ask'); return }
    const t = setTimeout(() => setI(i + 1), speed)
    return () => clearTimeout(t)
  }, [phase, i, speed, shown.length, deck])
  const start = () => { setSeed(randomSeed()); setI(0); setGuess(''); setPhase('run'); t0.current = performance.now() }
  const ok = Number(guess) === answer
  if (phase === 'ready') {
    return (
      <div className="rounded-2xl bg-ink-850 p-4 text-center">
        <p className="text-sm text-cream-200/80">{deck ? 'Tap through all 51 cards as fast as you can while keeping the count. Then enter your running count. The last card is your proof.' : `${count} cards will flash one at a time.`}</p>
        {!deck && (
          <div className="mt-3 flex justify-center">
            <Tabs value={String(speed)} onChange={(v) => setSpeed(Number(v))} tabs={[{ id: '1300', label: 'Slow' }, { id: '900', label: 'Medium' }, { id: '550', label: 'Fast' }]} />
          </div>
        )}
        <button className="btn-gold mt-3 px-8" onClick={start}>Start</button>
      </div>
    )
  }
  if (phase === 'run') {
    const c = shown[Math.min(i, shown.length - 1)]
    return (
      <div className="text-center">
        <div className="mb-2 text-xs text-cream-300/60">Card {Math.min(i + 1, shown.length)} of {shown.length}</div>
        <div className="flex justify-center rounded-2xl bg-felt-800/60 p-5">{i < shown.length && <PlayingCard key={i} card={c} size="xl" dealDelay={0} />}</div>
        {deck && <button className="btn-gold mt-3 w-full py-4 text-base" onClick={() => { if (i + 1 >= shown.length) { setMs(performance.now() - t0.current); setPhase('ask') } else setI(i + 1) }}>Next card</button>}
      </div>
    )
  }
  if (phase === 'ask') {
    return (
      <form className="rounded-2xl bg-ink-850 p-4" onSubmit={(e) => {
        e.preventDefault()
        if (!guess.trim()) return
        setPhase('done')
        const right = Number(guess) === answer
        update((p, c) => recordCount(p, c, 'rc', right, deck ? ms : undefined))
        onDone?.(right)
      }}>
        <label className="block text-sm text-cream-100">What’s the running count?
          <input autoFocus className="input mt-2" inputMode="numeric" placeholder="e.g. -2" value={guess} onChange={(e) => setGuess(e.target.value.replace(/[^\d-]/g, ''))} />
        </label>
        <button className="btn-gold mt-3 w-full" type="submit">Check</button>
      </form>
    )
  }
  return (
    <div className="rounded-2xl bg-ink-850 p-4 text-center">
      <p className={`font-display text-2xl ${ok ? 'text-emerald-300' : 'text-ruby-400'}`}>{ok ? 'Correct!' : `It was ${answer > 0 ? '+' : ''}${answer}`}</p>
      {deck && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <PlayingCard card={cards[51]} size="md" />
          <p className="text-sm text-cream-200/80">The last card counts {hiLo(cards[51]) > 0 ? '+1' : hiLo(cards[51]) < 0 ? '−1' : '0'}. A full deck sums to 0, so the count before it had to be {-hiLo(cards[51]) > 0 ? '+' : ''}{-hiLo(cards[51])}. {ok ? `You counted the deck in ${(ms / 1000).toFixed(1)} seconds.` : ''}</p>
        </div>
      )}
      <button className="btn-ghost mt-3" onClick={start}><Icon name="reset" size={14} /> Again</button>
    </div>
  )
}

export function TcDrill({ count = 8, onDone }: { count?: number; onDone?: (score: number) => void }) {
  const rng = useMemo(() => createRng(randomSeed()), [])
  const make = () => ({ rc: Math.floor(rng.next() * 25) - 12, decks: (1 + Math.floor(rng.next() * 11)) / 2 })
  const [q, setQ] = useState(make)
  const [n, setN] = useState(0)
  const [score, setScore] = useState(0)
  const [guess, setGuess] = useState('')
  const [res, setRes] = useState<boolean | null>(null)
  const ans = trueCountForPlay(q.rc, q.decks)
  if (n >= count) return <div className="rounded-xl bg-ink-850 p-4 text-center"><div className="font-display text-2xl text-cream-50">{score}/{count}</div><p className="text-sm text-cream-300/70">True count conversion is the counter’s most important arithmetic.</p></div>
  return (
    <form className="rounded-2xl bg-ink-850 p-4" onSubmit={(e) => {
      e.preventDefault()
      if (res !== null) { setN(n + 1); setQ(make()); setGuess(''); setRes(null); if (n + 1 >= count) onDone?.(score); return }
      if (!guess.trim()) return
      const ok = Number(guess) === ans
      setRes(ok)
      if (ok) setScore(score + 1)
      update((p, c) => recordCount(p, c, 'tc', ok))
    }}>
      <div className="mb-2 text-xs text-cream-300/60">{n + 1} of {count}</div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-ink-800 p-3"><div className="label">Running count</div><div className="mt-1 font-display text-3xl text-cream-50">{q.rc > 0 ? '+' : ''}{q.rc}</div></div>
        <div className="rounded-xl bg-ink-800 p-3"><div className="label">Decks left</div><div className="mt-1 font-display text-3xl text-cream-50">{q.decks}</div></div>
      </div>
      <label className="mt-3 block text-sm text-cream-100">True count (round toward zero)
        <input className="input mt-1.5" inputMode="numeric" value={guess} disabled={res !== null} onChange={(e) => setGuess(e.target.value.replace(/[^\d-]/g, ''))} placeholder="e.g. 2" />
      </label>
      {res !== null && <p className={`mt-2 text-sm ${res ? 'text-emerald-300' : 'text-ruby-400'}`}>{res ? 'Correct.' : `${q.rc} ÷ ${q.decks} = ${(q.rc / q.decks).toFixed(2)}, which rounds toward zero to ${ans > 0 ? '+' : ''}${ans}.`}</p>}
      <button className="btn-gold mt-3 w-full" type="submit">{res === null ? 'Check' : 'Next'}</button>
    </form>
  )
}

export function DeckEstimation({ count = 6, onDone }: { count?: number; onDone?: (score: number) => void }) {
  const rng = useMemo(() => createRng(randomSeed()), [])
  const SHOE = 6
  const make = () => (1 + Math.floor(rng.next() * 9)) / 2 // 0.5..4.5 discarded
  const [d, setD] = useState(make)
  const [n, setN] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const remaining = SHOE - d
  const options = [remaining - 1, remaining - 0.5, remaining, remaining + 0.5, remaining + 1].filter((x) => x > 0 && x <= SHOE)
  if (n >= count) return <div className="rounded-xl bg-ink-850 p-4 text-center"><div className="font-display text-2xl text-cream-50">{score}/{count}</div><p className="text-sm text-cream-300/70">Within half a deck is good enough in practice.</p></div>
  return (
    <div>
      <div className="mb-2 text-xs text-cream-300/60">{n + 1} of {count} · 6-deck shoe</div>
      <div className="flex items-end justify-center gap-6 rounded-2xl bg-felt-800/60 p-4">
        <svg viewBox="0 0 80 140" width="80" height="140" role="img" aria-label="Discard tray">
          <rect x="4" y="4" width="72" height="132" rx="6" fill="#0d0f12" stroke="#d4a63b" strokeOpacity=".5" />
          {Array.from({ length: 6 }).map((_, k) => <line key={k} x1="4" x2="12" y1={136 - (k + 1) * 21} y2={136 - (k + 1) * 21} stroke="#d4a63b" strokeOpacity=".35" />)}
          <rect x="14" y={136 - d * 21} width="54" height={d * 21 - 2} fill="#f3ead3" />
          {Array.from({ length: Math.floor(d * 10) }).map((_, k) => <line key={k} x1="14" x2="68" y1={136 - k * 2.1} y2={136 - k * 2.1} stroke="#c9b98f" strokeWidth=".5" />)}
        </svg>
        <p className="max-w-[160px] text-xs text-cream-200/70">Each tick on the side is one deck (52 cards). How many decks are left in the shoe?</p>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {options.map((o) => (
          <button key={o} disabled={picked !== null} onClick={() => { setPicked(o); if (o === remaining) setScore(score + 1) }} className={`rounded-lg py-2.5 text-sm font-semibold ${picked !== null ? (o === remaining ? 'bg-emerald-500 text-ink-950' : o === picked ? 'bg-ruby-500 text-cream-50' : 'bg-ink-800 text-cream-300/40') : 'bg-ink-800 text-cream-100 hover:bg-ink-700'}`}>{o}</button>
        ))}
      </div>
      {picked !== null && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm text-cream-200/80">{d} decks in the tray → {remaining} left.</p>
          <button className="btn-gold px-4 py-2" onClick={() => { setN(n + 1); setD(make()); setPicked(null); if (n + 1 >= count) onDone?.(score) }}>Next</button>
        </div>
      )}
    </div>
  )
}

export function ChartWidget({ editable = false }: { editable?: boolean }) {
  const p = useProgress()
  const [r, setR] = useState<TableRules>(() => ({ ...p.settings.rules }))
  const rules = editable ? r : p.settings.rules
  return (
    <div>
      {editable && (
        <div className="mb-3 grid gap-x-6 sm:grid-cols-2">
          <Toggle label="Dealer hits soft 17" checked={r.dealerHitsSoft17} onChange={(v) => setR({ ...r, dealerHitsSoft17: v })} />
          <Toggle label="Double after split" checked={r.doubleAfterSplit} onChange={(v) => setR({ ...r, doubleAfterSplit: v })} />
          <Toggle label="Late surrender" checked={r.lateSurrender} onChange={(v) => setR({ ...r, lateSurrender: v })} />
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-sm font-medium text-cream-100">Decks</span>
            <div className="flex gap-1">{([1, 2, 6] as const).map((d) => <button key={d} onClick={() => setR({ ...r, decks: d })} className={`h-8 w-10 rounded-md text-sm font-semibold ${r.decks === d ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{d}</button>)}</div>
          </div>
        </div>
      )}
      <StrategyChart rules={rules} />
    </div>
  )
}

export function PerfectPairsWidget() {
  const [d, setD] = useState(6)
  const res = perfectPairs(d)
  return (
    <div>
      <DeckPicker d={d} setD={setD} />
      <table className="mt-3 w-full text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-cream-300/50"><th className="pb-1.5">Hand</th><th className="pb-1.5">Pays</th><th className="pb-1.5 text-right">Chance</th></tr></thead>
        <tbody className="divide-y divide-white/5">
          {res.lines.map((l) => <tr key={l.name}><td className="py-1.5 text-cream-100">{l.name}</td><td className="text-cream-300/70">{l.pays} to 1</td><td className="text-right tabular-nums text-cream-200">{pct(l.prob, 2)}</td></tr>)}
          <tr><td className="py-1.5 text-cream-100">No pair (bet loses)</td><td /><td className="text-right tabular-nums text-cream-200">{pct(1 - res.hitRate, 2)}</td></tr>
        </tbody>
      </table>
      <div className="mt-3 rounded-xl bg-ruby-500/15 p-3 text-center"><div className="label">House edge</div><div className="font-display text-3xl text-ruby-400">{(res.houseEdge * 100).toFixed(2)}%</div></div>
      {d === 1 && <p className="mt-2 text-xs text-cream-300/60">With one deck, a same-suit pair is impossible, so the 25:1 payout never happens.</p>}
    </div>
  )
}

export function TwentyOnePlusThreeWidget() {
  const [d, setD] = useState(6)
  const [t, setT] = useState<keyof typeof TWENTY_ONE_PLUS_THREE_TABLES>('classic')
  const res = twentyOnePlusThree(d, t)
  return (
    <div>
      <DeckPicker d={d} setD={setD} />
      <Tabs className="mt-2 w-fit" value={t} onChange={setT} tabs={[{ id: 'classic', label: 'Classic 9:1' }, { id: 'modern', label: 'Modern 100/40/30/10/5' }]} />
      <table className="mt-3 w-full text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-cream-300/50"><th className="pb-1.5">Hand</th><th className="pb-1.5">Pays</th><th className="pb-1.5 text-right">Chance</th></tr></thead>
        <tbody className="divide-y divide-white/5">
          {res.lines.map((l) => <tr key={l.name}><td className="py-1.5 text-cream-100">{l.name}</td><td className="text-cream-300/70">{l.pays} to 1</td><td className="text-right tabular-nums text-cream-200">{pct(l.prob, 2)}</td></tr>)}
        </tbody>
      </table>
      <div className="mt-3 rounded-xl bg-ruby-500/15 p-3 text-center"><div className="label">House edge</div><div className="font-display text-3xl text-ruby-400">{(res.houseEdge * 100).toFixed(2)}%</div></div>
    </div>
  )
}

function DeckPicker({ d, setD }: { d: number; setD: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-cream-300/70">Decks</span>
      {[1, 2, 6, 8].map((n) => <button key={n} onClick={() => setD(n)} className={`h-8 w-10 rounded-md font-semibold ${d === n ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{n}</button>)}
    </div>
  )
}

export function IndexPlays() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-cream-300/50"><th className="pb-1.5">#</th><th>Hand</th><th>Basic</th><th>Deviation</th><th>When</th></tr></thead>
        <tbody className="divide-y divide-white/5">
          {ILLUSTRIOUS_18.map((x, i) => (
            <tr key={x.id}>
              <td className="py-1.5 text-cream-300/50">{i + 1}</td>
              <td className="font-semibold text-cream-50">{x.hand}</td>
              <td className="text-cream-300/70">{x.basic === 'no-insurance' ? 'No insurance' : ACTION_LABEL[x.basic as Action]}</td>
              <td className="text-gold-100">{x.deviation === 'insurance' ? 'Insure' : ACTION_LABEL[x.deviation as Action]}</td>
              <td className="text-cream-200">TC {x.direction === 'at-or-above' ? '≥' : '≤'} {x.index > 0 ? '+' : ''}{x.index}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-cream-300/50">Source: Don Schlesinger, Blackjack Attack (Hi-Lo, multi-deck, S17). Indexes differ for other rules and counts.</p>
    </div>
  )
}

export function RemovalEffects() {
  const p = useProgress()
  const effects = useMemo(() => removalEffects(p.settings.rules), [p.settings.rules])
  const max = Math.max(...effects.map((e) => Math.abs(e.effect)))
  const label = (r: number) => (r === 1 ? 'A' : r === 10 ? '10' : String(r))
  return (
    <div>
      <div className="space-y-1.5">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 1].map((r) => {
          const e = effects.find((x) => x.rank === r)!.effect
          return (
            <div key={r} className="flex items-center gap-2 text-sm">
              <span className="w-6 font-semibold text-cream-100">{label(r)}</span>
              <div className="relative h-5 flex-1 rounded bg-white/5">
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
                <div className={`absolute inset-y-0.5 rounded-sm ${e >= 0 ? 'left-1/2 bg-emerald-400/80' : 'right-1/2 bg-ruby-500/80'}`} style={{ width: `${(Math.abs(e) / max) * 50}%` }} />
              </div>
              <span className="w-16 text-right tabular-nums text-cream-200">{e >= 0 ? '+' : ''}{(e * 100).toFixed(2)}%</span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-cream-300/50">Change in the player’s expectation when one card of that rank is removed from a single deck, computed for your table rules. Green: removing it helps you. Notice the pattern Hi-Lo is built on: small cards out = good, tens and Aces out = bad.</p>
    </div>
  )
}

export function DecisionDrill({ category = 'all', count = 10, rules: override }: { category?: DrillCategory; count?: number; rules?: Partial<TableRules> }) {
  const p = useProgress()
  const rules = useMemo(() => sanitizeRules({ ...p.settings.rules, ...(override ?? {}) }), [p.settings.rules, override])
  return <DecisionTrainer mode="challenge" rules={rules} category={category} count={count} source="lesson" />
}
