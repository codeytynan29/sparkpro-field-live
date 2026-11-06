import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cardsRemaining, stackedShoe, type Card, type Shoe } from '../engine/cards'
import { runningCount, trueCount } from '../engine/count'
import {
  act, availableActions, createGame, GameError, insuranceDecision, isHumanTurn, seatNet, seenCards, startRound,
  type GameEvent, type GameState, type Seat, type SeatConfig,
} from '../engine/game'
import { describeHand, handValue, isNatural } from '../engine/hand'
import { randomSeed, createRng } from '../engine/rng'
import { shortRules, type TableRules } from '../engine/rules'
import { ACTION_LABEL, type Action } from '../engine/strategy'
import { breakdownHand, feedbackForDecision, hintFor, type DecisionFeedback, type HandBreakdown } from '../engine/teaching'
import { dealerLine, signalLine, SIGNALS, VENUES } from '../content/dialogue'
import { recordCount, recordDecision, recordHand, resetBankroll, setBankroll, type Venue } from '../state/progress'
import { getProgress, update, useProgress } from '../state/store'
import { Chip, CHIP_VALUES, ChipStack, money } from './Chip'
import { HandSignal } from './HandSignal'
import { Icon } from './Icons'
import { PlayingCard } from './PlayingCard'
import { ReferenceDrawer } from './ReferenceDrawer'
import { BreakdownCard, FeedbackCard } from './Teaching'
import { DealerAvatar, Sheet } from './ui'

const NPCS: SeatConfig[] = [
  { name: 'Marty', human: false, style: 'basic', stack: 5000 },
  { name: 'Dolores', human: false, style: 'cautious', stack: 5000 },
  { name: 'Big Lou', human: false, style: 'gambler', stack: 5000 },
]

interface SessionStats {
  hands: number
  decisions: number
  correct: number
  net: number
  correctLosses: number
  mistakeWins: number
  mistakes: { label: string; should: string }[]
  startBankroll: number
}

const STEP: Record<string, number> = { relaxed: 540, normal: 380, fast: 210 }

function seatsFor(venue: Venue, humans: number, bankroll: number): SeatConfig[] {
  const human: SeatConfig[] = Array.from({ length: humans }, (_, i) => ({ name: humans > 1 ? `You · ${i + 1}` : 'You', human: true, stack: i === 0 ? bankroll : 0, wallet: undefined }))
  if (venue !== 'atlantic-city') return human.map((h, i) => ({ ...h, wallet: undefined, stack: i === 0 ? bankroll : 0 }))
  // First base, (you), …, third base.
  const npcs = NPCS.slice(0, Math.max(1, 5 - humans - 1))
  return [npcs[0], ...human, ...npcs.slice(1)]
}

/**
 * Test hook for the end-to-end suite: if localStorage 'bj-test-shoe' holds card codes
 * ("10S 6H 9D ..."), the table deals from that exact order. Ignored otherwise.
 */
function testShoe(): Shoe | undefined {
  try {
    const raw = localStorage.getItem('bj-test-shoe')
    return raw ? stackedShoe(raw) : undefined
  } catch {
    return undefined
  }
}

function cardKey(prefix: string, i: number, c: Card) {
  return `${prefix}-${i}-${c.rank}${c.suit}`
}

function allKeys(g: GameState | null): Set<string> {
  const out = new Set<string>()
  if (!g) return out
  g.dealer.forEach((c, i) => out.add(cardKey(`d${g.round}`, i, c)))
  for (const s of g.seats) for (const h of s.hands) h.cards.forEach((c, i) => out.add(cardKey(h.id, i, c)))
  return out
}

/** Order newly visible cards by the engine's event sequence so they deal in turn. */
function planAnimation(prev: GameState | null, next: GameState, step: number) {
  const before = allKeys(prev)
  const delays = new Map<string, number>()
  let slot = 0
  let revealAt: number | null = null
  const claimed = new Set<string>()
  const findKey = (prefix: string, cards: Card[], card: Card) => {
    for (let i = 0; i < cards.length; i++) {
      const k = cardKey(prefix, i, cards[i])
      if (!before.has(k) && !claimed.has(k) && cards[i].rank === card.rank && cards[i].suit === card.suit) return k
    }
    return null
  }
  const handById = new Map<string, Card[]>()
  for (const s of next.seats) for (const h of s.hands) handById.set(h.id, h.cards)
  for (const e of next.events as GameEvent[]) {
    if (e.t === 'deal' && e.to !== 'dealer' && e.hand) {
      const cards = handById.get(e.hand)
      const k = cards && findKey(e.hand, cards, e.card)
      if (k) { claimed.add(k); delays.set(k, slot * step); slot += 0.55 }
    } else if ((e.t === 'deal' && e.to === 'dealer') || e.t === 'dealer-draw') {
      const k = findKey(`d${next.round}`, next.dealer, e.card)
      if (k) { claimed.add(k); delays.set(k, slot * step); slot += e.t === 'deal' ? 0.55 : 1 }
    } else if (e.t === 'reveal') {
      revealAt = slot++ * step
    } else if (e.t === 'settle' || e.t === 'peek') {
      slot += 0.5
    }
  }
  // Any new card not matched to an event (e.g. split re-ordering) shows immediately.
  return { delays, revealAt, total: slot * step + (slot ? step : 0) }
}

export function CasinoTable({ venue, rules, countQuiz = false, onExit }: { venue: Venue; rules: TableRules; countQuiz?: boolean; onExit?: () => void }) {
  const progress = useProgress()
  const settings = progress.settings
  const bankroll = progress.chips.bankroll
  const humans = rules.playerHands
  const physical = venue === 'atlantic-city'
  const faceDownGame = physical && rules.decks <= 2
  const coaching = venue === 'practice'
  const step = settings.reduceMotion ? 0 : STEP[settings.dealerSpeed] ?? 380
  const rng = useMemo(() => createRng(randomSeed()), [])

  const [game, setGame] = useState<GameState>(() => createGame(rules, seatsFor(venue, humans, getProgress().chips.bankroll), randomSeed(), testShoe()))
  const [anim, setAnim] = useState<{ delays: Map<string, number>; revealPending: boolean }>({ delays: new Map(), revealPending: false })
  const [busy, setBusy] = useState(false)
  const [bet, setBet] = useState(() => Math.max(rules.minBet, Math.min(rules.maxBet, rules.minBet * 2)))
  const [message, setMessage] = useState(() => dealerLine(venue, 'bets', rng))
  const [signalNote, setSignalNote] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<DecisionFeedback | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [breakdowns, setBreakdowns] = useState<HandBreakdown[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refOpen, setRefOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [countAsk, setCountAsk] = useState<{ answer: number; guess: string; result?: boolean } | null>(null)
  const [session, setSession] = useState<SessionStats>(() => ({ hands: 0, decisions: 0, correct: 0, net: 0, correctLosses: 0, mistakeWins: 0, mistakes: [], startBankroll: getProgress().chips.bankroll }))
  const timers = useRef<number[]>([])
  const roundsRef = useRef(0)

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  // Rebuild the table when rules or venue change (between sessions).
  const rulesKey = JSON.stringify(rules)
  const firstBuild = useRef(true)
  useEffect(() => {
    if (firstBuild.current) {
      firstBuild.current = false
      return
    }
    setGame(createGame(rules, seatsFor(venue, humans, getProgress().chips.bankroll), randomSeed(), testShoe()))
    setBreakdowns([])
    setFeedback(null)
    setMessage(dealerLine(venue, 'bets', rng))
    setBet((b) => Math.max(rules.minBet, Math.min(rules.maxBet, b)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rulesKey, venue, humans, rng])

  const humanSeats = game.seats.filter((s) => s.human)
  const wallet = humanSeats[0]
  const stackNow = game.phase === 'betting' || game.phase === 'settled' ? bankroll : wallet?.stack ?? 0

  const applyState = useCallback((prev: GameState, next: GameState, opts: { action?: Action } = {}) => {
    const plan = planAnimation(prev, next, step)
    setAnim({ delays: plan.delays, revealPending: plan.revealAt != null })
    setGame(next)
    setBusy(plan.total > 0)
    setHint(null)
    if (plan.revealAt != null) later(() => setAnim((a) => ({ ...a, revealPending: false })), plan.revealAt)
    later(() => setBusy(false), plan.total)

    // Record the player's new decisions.
    const newDecisions = prev.round === next.round ? next.decisions.slice(prev.decisions.length) : next.decisions
    for (const d of newDecisions) {
      update((p, c) => recordDecision(p, c, {
        type: d.kind === 'insurance' ? 'insurance' : (d.action as Action),
        recommended: d.kind === 'insurance' ? 'insurance' : (d.recommended as Action),
        correct: d.correct,
        cell: d.kind === 'insurance' ? 'insurance' : d.rec?.cell,
        kind: d.rec?.kind,
        chose: String(d.action),
        source: 'table',
      }))
      const fb = feedbackForDecision(d, next.rules)
      setSession((s) => ({ ...s, decisions: s.decisions + 1, correct: s.correct + (d.correct ? 1 : 0), mistakes: d.correct ? s.mistakes : [{ label: d.kind === 'insurance' ? 'Insurance offer' : `${describeHand(d.cards)} vs ${d.dealerUp.rank}`, should: String(d.recommended) }, ...s.mistakes].slice(0, 20) }))
      if (coaching) setFeedback(fb)
    }

    // Dealer talk.
    const ev = next.events
    let line: string | null = null
    if (ev.some((e) => e.t === 'shuffle')) line = dealerLine(venue, 'shuffle', rng)
    if (next.phase === 'insurance') line = dealerLine(venue, 'insurance', rng)
    else if (ev.some((e) => e.t === 'peek' && e.blackjack)) line = dealerLine(venue, 'peekYes', rng)
    else if (ev.some((e) => e.t === 'peek' && !e.blackjack) && next.phase === 'playing') line = dealerLine(venue, 'peekNo', rng)
    if (opts.action && physical) setSignalNote(signalLine(opts.action, faceDownGame))
    else setSignalNote(null)

    if (next.phase === 'playing' && isHumanTurn(next)) {
      const cur = next.seats[next.activeSeat]
      const h = cur.hands[cur.activeHand]
      const v = handValue(h.cards)
      if (!line) line = venue === 'online' ? dealerLine(venue, 'turn', rng) : `${humans > 1 || cur.hands.length > 1 ? `${cur.name}${cur.hands.length > 1 ? `, hand ${cur.activeHand + 1}` : ''}: ` : ''}${v.soft ? 'soft ' : ''}${v.total}. ${dealerLine(venue, 'turn', rng)}`
    }
    if (next.phase === 'settled') {
      const dv = handValue(next.dealer)
      const dealerSays = next.dealerBlackjack ? dealerLine(venue, 'peekYes', rng) : dv.bust ? dealerLine(venue, 'dealerBust', rng) : `Dealer has ${dv.total}.`
      later(() => setMessage(dealerSays), plan.total)
      settleRound(next)
    } else if (line) setMessage(line)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, venue, coaching, physical, faceDownGame, humans, rng, later])

  function settleRound(s: GameState) {
    const mine = s.seats.filter((x) => x.human)
    const bds: HandBreakdown[] = []
    let net = 0
    let cl = 0
    let mw = 0
    for (const seat of mine) {
      for (const [hi, hand] of seat.hands.entries()) {
        // Fold the insurance result into the first hand's review so the dealer talks about the whole round.
        const ins = hi === 0 ? seat.insuranceNet ?? 0 : 0
        const b = breakdownHand(ins ? { ...hand, net: (hand.net ?? 0) + ins } : hand, s.dealer, s.decisions, s.rules, s.round + bds.length)
        if (ins) b.lesson = `Insurance ${ins > 0 ? `paid ${money(ins)} at 2:1` : `lost ${money(-ins)}`}, included in this result. ${b.lesson}`
        bds.push(b)
        const decs = s.decisions.filter((d) => d.handId === hand.id)
        const allCorrect = decs.length ? decs.every((d) => d.correct) : null
        if (allCorrect === true && (hand.net ?? 0) < 0) cl++
        if (allCorrect === false && (hand.net ?? 0) > 0) mw++
        update((p, c) => recordHand(p, c, { net: hand.net ?? 0, blackjack: isNatural(hand.cards, hand.fromSplit) && !s.dealerBlackjack, allCorrect }))
      }
      net += seatNet(seat)
    }
    const total = mine.reduce((a, x) => a + x.stack, 0)
    update((p) => setBankroll(p, total))
    setSession((x) => ({ ...x, hands: x.hands + mine.reduce((a, m) => a + m.hands.length, 0), net: x.net + net, correctLosses: x.correctLosses + cl, mistakeWins: x.mistakeWins + mw }))
    const plan = planAnimation(null, s, step)
    later(() => setBreakdowns(bds), Math.min(plan.total, 4000))
    roundsRef.current++
    if (countQuiz && roundsRef.current % 2 === 0) {
      const rc = runningCount(seenCards(s))
      later(() => setCountAsk({ answer: rc, guess: '' }), Math.min(plan.total, 4000) + 200)
    }
  }

  const humanCount = humanSeats.length
  const maxAffordable = Math.floor(bankroll / humanCount)
  const betOk = bet >= rules.minBet && bet <= rules.maxBet && bet * humanCount <= bankroll

  const deal = useCallback(() => {
    if (busy || countAsk) return
    setError(null)
    setFeedback(null)
    setBreakdowns([])
    setSignalNote(null)
    try {
      // Sync the wallet with saved bankroll (it may have been reset elsewhere).
      let g = structuredClone(game)
      g.seats.forEach((s) => { if (s.human) s.stack = s.id === wallet.id ? getProgress().chips.bankroll : 0 })
      g.seats.forEach((s) => { if (s.human && s.id !== wallet.id) s.wallet = wallet.id })
      const bets: Record<number, number> = {}
      for (const s of g.seats) {
        if (s.human) bets[s.id] = bet
        else {
          const mult = s.style === 'gambler' ? 1 + Math.floor(rng.next() * 4) : 1 + Math.floor(rng.next() * 2)
          bets[s.id] = Math.min(rules.maxBet, Math.max(rules.minBet, rules.minBet * mult))
        }
      }
      setMessage(dealerLine(venue, 'noMore', rng))
      const next = startRound(g, bets)
      g = next
      applyState(game, next)
    } catch (e) {
      setError(e instanceof GameError ? e.message : 'Something went wrong dealing that hand. Try again.')
    }
  }, [busy, countAsk, game, wallet, bet, rules, rng, venue, applyState])

  const doAction = useCallback((a: Action) => {
    if (busy) return
    setError(null)
    try {
      const next = act(game, a)
      applyState(game, next, { action: a })
    } catch (e) {
      setError(e instanceof GameError ? e.message : 'That move isn’t available.')
    }
  }, [busy, game, applyState])

  const doInsurance = useCallback((take: boolean) => {
    const seat = game.seats.find((s) => s.human && !s.sittingOut && !s.insuranceDecided)
    if (!seat || busy) return
    try {
      const next = insuranceDecision(game, seat.id, take)
      applyState(game, next)
    } catch (e) {
      setError(e instanceof GameError ? e.message : 'Could not place insurance.')
    }
  }, [game, busy, applyState])

  const actions = availableActions(game)
  const myTurn = isHumanTurn(game) && !busy
  const insuranceSeat = game.phase === 'insurance' ? game.seats.find((s) => s.human && !s.sittingOut && !s.insuranceDecided) : undefined
  const evenMoneyOffer = insuranceSeat ? isNatural(insuranceSeat.hands[0].cards, false) : false
  const betting = game.phase === 'betting' || game.phase === 'settled'

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || e.metaKey || e.ctrlKey) return
      const k = e.key.toLowerCase()
      const map: Record<string, Action> = { h: 'hit', s: 'stand', d: 'double', p: 'split', r: 'surrender' }
      if (myTurn && map[k] && actions.includes(map[k])) { e.preventDefault(); doAction(map[k]) }
      else if (betting && (k === ' ' || k === 'enter') && betOk && !busy) { e.preventDefault(); deal() }
      else if (insuranceSeat && (k === 'y' || k === 'n')) doInsurance(k === 'y')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [myTurn, actions, doAction, betting, betOk, busy, deal, insuranceSeat, doInsurance])

  const showCount = (settings.showCount && !countQuiz) || false
  const rc = runningCount(seenCards(game))
  const decksLeft = cardsRemaining(game.shoe) / 52
  const tc = trueCount(rc, decksLeft)
  const holeDown = !game.holeRevealed || anim.revealPending
  const dv = handValue(holeDown ? game.dealer.slice(0, 1) : game.dealer)
  const venueInfo = VENUES.find((v) => v.id === venue)!
  const outOfChips = betting && bankroll < rules.minBet

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="label">{venueInfo.name}</div>
          <div className="text-xs text-cream-300/60">{shortRules(rules)} · ${rules.minBet}–${rules.maxBet}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="panel-soft flex items-center gap-2 px-3 py-1.5" aria-label="Training chips">
            <Chip value={25} size={18} />
            <span className="text-sm font-semibold tabular-nums text-cream-50">{money(stackNow)}</span>
          </div>
          <button className="btn-ghost px-3 py-2" onClick={() => setRefOpen(true)} aria-label="Reference"><Icon name="book" size={16} /><span className="hidden sm:inline">Reference</span></button>
          <button className="btn-ghost px-3 py-2" onClick={() => setSummaryOpen(true)}><Icon name="progress" size={16} /><span className="hidden sm:inline">Session</span></button>
        </div>
      </div>

      {/* Felt */}
      <section className="felt felt-rim relative overflow-hidden rounded-[28px] px-3 pb-4 pt-4 sm:px-6 sm:pt-6" aria-label="Blackjack table">
        {/* shoe + tray */}
        <div className="pointer-events-none absolute right-3 top-3 hidden flex-col items-center sm:flex" aria-hidden="true">
          <div className="h-12 w-16 rounded-md border border-gold-400/30 bg-ink-900/70 shadow-inner" style={{ backgroundImage: 'linear-gradient(90deg, rgba(212,166,59,.12) 1px, transparent 1px)', backgroundSize: '4px 100%' }} />
          <span className="mt-1 text-[9px] uppercase tracking-wider text-gold-200/50">Shoe</span>
        </div>
        <div className="pointer-events-none absolute left-3 top-3 hidden flex-col items-center sm:flex" aria-hidden="true">
          <div className="relative h-12 w-12 overflow-hidden rounded-md border border-gold-400/25 bg-ink-900/60">
            <div className="absolute inset-x-1 bottom-1 rounded-sm bg-cream-200/80" style={{ height: `${Math.min(40, (game.shoe.pos / Math.max(1, game.shoe.cards.length)) * 40)}px` }} />
          </div>
          <span className="mt-1 text-[9px] uppercase tracking-wider text-gold-200/50">Discards</span>
        </div>

        {/* Dealer */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-200/70">
            Dealer
            {game.dealer.length > 0 && !busy && <span className="rounded-full bg-ink-950/60 px-2 py-0.5 text-xs tracking-normal text-cream-50">{holeDown ? dv.total : dv.blackjack ? 'Blackjack' : dv.bust ? `Bust ${dv.total}` : dv.total}</span>}
          </div>
          <div className="mt-2 flex min-h-[92px] -space-x-6 sm:min-h-[122px] sm:-space-x-8">
            {game.dealer.length === 0 && <div className="h-[90px] w-16 rounded-lg border border-dashed border-gold-200/20 sm:h-[118px] sm:w-[84px]" />}
            {game.dealer.map((c, i) => {
              const k = cardKey(`d${game.round}`, i, c)
              return <PlayingCard key={k} card={c} faceDown={i === 1 && holeDown} size="lg" dealDelay={anim.delays.get(k) ?? null} />
            })}
          </div>
          <div className="mt-3 text-center font-display text-[11px] uppercase tracking-[0.25em] text-gold-200/40 sm:text-xs">
            Blackjack pays {rules.blackjackPayout} · Dealer {rules.dealerHitsSoft17 ? 'hits' : 'stands on'} soft 17 · Insurance pays 2 to 1
          </div>
        </div>

        {/* Dealer message */}
        <div className="mx-auto mt-3 flex max-w-xl items-start gap-2.5 rounded-2xl border border-gold-300/20 bg-ink-950/55 px-3 py-2.5" aria-live="polite">
          <DealerAvatar size={32} mood={feedback && !feedback.correct ? 'concerned' : 'happy'} />
          <div className="min-w-0 text-sm text-cream-100">
            <p>{message}</p>
            {signalNote && <p className="mt-0.5 text-xs italic text-gold-200/80">{signalNote}</p>}
          </div>
        </div>

        {showCount && (
          <div className="mx-auto mt-2 flex w-fit gap-3 rounded-full bg-ink-950/60 px-3 py-1 text-[11px] text-cream-200/80" aria-label="Card count">
            <span>RC <b className="text-cream-50">{rc > 0 ? `+${rc}` : rc}</b></span>
            <span>Decks left <b className="text-cream-50">{decksLeft.toFixed(1)}</b></span>
            <span>TC <b className="text-cream-50">{tc >= 0 ? '+' : ''}{tc.toFixed(1)}</b></span>
          </div>
        )}

        {/* Seats */}
        <div className="mt-4 flex items-end justify-center gap-2 overflow-x-auto pb-1 sm:gap-4 no-scrollbar">
          {game.seats.map((seat) => (
            <SeatView key={seat.id} seat={seat} game={game} delays={anim.delays} busy={busy} big={seat.human} />
          ))}
        </div>
      </section>

      {error && <div className="rounded-xl border border-ruby-400/40 bg-ruby-600/15 px-4 py-2.5 text-sm text-ruby-400" role="alert">{error}</div>}

      {/* Controls */}
      <section className="panel p-4" aria-label="Controls">
        {outOfChips ? (
          <div className="text-center">
            <p className="font-display text-lg text-cream-50">Out of training chips</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-cream-300/70">It happens, even with perfect play. These are practice chips, so a fresh stack is free. Real-world lesson: when a session budget is gone, the session is over.</p>
            <button className="btn-gold mt-3" onClick={() => update((p) => resetBankroll(p))}>Reset to $1,000 training chips</button>
          </div>
        ) : countAsk ? (
          <CountPrompt ask={countAsk} onChange={setCountAsk} onSubmit={() => {
            const ok = Number(countAsk.guess) === countAsk.answer
            update((p, c) => recordCount(p, c, 'rc', ok))
            setCountAsk({ ...countAsk, result: ok })
          }} />
        ) : betting ? (
          <BettingControls bet={bet} setBet={setBet} rules={rules} max={Math.min(rules.maxBet, maxAffordable)} humanCount={humanCount} onDeal={deal} betOk={betOk} busy={busy} again={game.phase === 'settled'} />
        ) : game.phase === 'insurance' && insuranceSeat ? (
          <InsurancePrompt evenMoney={evenMoneyOffer} venue={venue} bet={insuranceSeat.hands[0].bet} onDecide={doInsurance} disabled={busy} showHint={coaching} />
        ) : myTurn ? (
          <div>
            <ActionButtons actions={actions} onAction={doAction} physical={physical} faceDown={faceDownGame} />
            {coaching && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button className="btn-quiet px-3 py-1.5 text-xs" onClick={() => {
                  const cur = game.seats[game.activeSeat]
                  setHint(hintFor(cur.hands[cur.activeHand].cards, game.dealer[0], rules))
                }}><Icon name="lightbulb" size={14} /> Hint</button>
                <button className="btn-quiet px-3 py-1.5 text-xs" onClick={() => setRefOpen(true)}><Icon name="strategy" size={14} /> Chart</button>
                <span className="hidden text-[11px] text-cream-300/40 sm:inline">Keys: H S D P R</span>
              </div>
            )}
            {hint && <p className="fade-up mt-2 rounded-xl bg-gold-400/10 px-3 py-2 text-sm text-gold-100">{hint}</p>}
          </div>
        ) : (
          <div className="flex h-12 items-center justify-center text-sm text-cream-300/60">{game.phase === 'dealer' || busy ? 'Dealing…' : 'Waiting…'}</div>
        )}
      </section>

      {/* Teaching dealer */}
      {(feedback || breakdowns.length > 0) && (
        <section className="space-y-3" aria-label="Teaching dealer">
          <div className="label">The Teaching Dealer</div>
          {feedback && breakdowns.length === 0 && <FeedbackCard fb={feedback} />}
          {breakdowns.map((b, i) => <BreakdownCard key={b.handId} b={b} index={breakdowns.length > 1 ? i : undefined} />)}
        </section>
      )}

      <ReferenceDrawer open={refOpen} onClose={() => setRefOpen(false)} />
      <Sheet open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Session summary">
        <SessionSummary s={session} bankroll={bankroll} />
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => { setSession({ hands: 0, decisions: 0, correct: 0, net: 0, correctLosses: 0, mistakeWins: 0, mistakes: [], startBankroll: bankroll }); setSummaryOpen(false) }}>Start a new session</button>
          {onExit && <button className="btn-gold flex-1" onClick={onExit}>Leave the table</button>}
        </div>
      </Sheet>
    </div>
  )
}

function SeatView({ seat, game, delays, busy, big }: { seat: Seat; game: GameState; delays: Map<string, number>; busy: boolean; big: boolean }) {
  const active = game.phase === 'playing' && game.activeSeat === seat.id
  return (
    <div className={`flex min-w-[76px] flex-col items-center ${big ? '' : 'opacity-90'}`}>
      <div className={`flex items-end gap-2 ${seat.hands.length > 1 ? 'flex-row' : ''}`}>
        {seat.hands.length === 0 && (
          <div className={`flex items-center justify-center rounded-full border border-dashed border-gold-200/30 ${big ? 'h-16 w-16' : 'h-12 w-12'}`}>
            <span className="text-[10px] uppercase tracking-wider text-gold-200/40">Bet</span>
          </div>
        )}
        {seat.hands.map((h, hi) => {
          const isActive = active && seat.activeHand === hi
          const v = handValue(h.cards)
          const showResult = game.phase === 'settled' && !busy && h.outcome
          return (
            <div key={h.id} className={`relative flex flex-col items-center rounded-2xl px-1.5 pb-1 pt-1.5 transition ${isActive ? 'glow bg-gold-400/10 ring-1 ring-gold-300/60' : ''}`}>
              <div className={`flex ${big ? '-space-x-8 sm:-space-x-10' : '-space-x-7'}`}>
                {h.cards.map((c, i) => {
                  const k = cardKey(h.id, i, c)
                  return <PlayingCard key={k} card={c} size={big ? 'md' : 'sm'} dealDelay={delays.get(k) ?? null} />
                })}
              </div>
              <div className="mt-1 flex items-center gap-1">
                {!busy && h.cards.length > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${v.bust ? 'bg-ruby-500/80 text-cream-50' : 'bg-ink-950/70 text-cream-50'}`}>
                    {v.blackjack && !h.fromSplit ? 'BJ' : v.bust ? 'Bust' : `${v.soft && v.total < 21 ? 'soft ' : ''}${v.total}`}
                  </span>
                )}
                <ChipStack amount={h.bet} size={big ? 22 : 16} />
                {h.doubled && <span className="text-[10px] font-semibold text-gold-200">×2</span>}
              </div>
              {showResult && <OutcomeBadge outcome={h.outcome!} net={h.net ?? 0} />}
            </div>
          )
        })}
      </div>
      {seat.insurance > 0 && <span className="mt-0.5 rounded bg-gold-400/20 px-1.5 text-[10px] text-gold-100">Insured {money(seat.insurance)}</span>}
      <span className={`mt-1 text-[11px] font-medium ${seat.human ? 'text-gold-100' : 'text-cream-300/60'}`}>{seat.name}</span>
    </div>
  )
}

function OutcomeBadge({ outcome, net }: { outcome: string; net: number }) {
  const label: Record<string, string> = { blackjack: 'Blackjack!', win: 'Win', lose: 'Lose', push: 'Push', bust: 'Bust', surrender: 'Surrendered', 'dealer-blackjack': 'Dealer BJ', 'even-money': 'Even money' }
  const good = net > 0
  return (
    <span className={`pop-in mt-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${good ? 'bg-emerald-400 text-ink-950' : net < 0 ? 'bg-ruby-500 text-cream-50' : 'bg-cream-200 text-ink-950'}`}>
      {label[outcome] ?? outcome} {net !== 0 && money(net, true)}
    </span>
  )
}

function BettingControls({ bet, setBet, rules, max, humanCount, onDeal, betOk, busy, again }: { bet: number; setBet: (n: number) => void; rules: TableRules; max: number; humanCount: number; onDeal: () => void; betOk: boolean; busy: boolean; again: boolean }) {
  const add = (v: number) => setBet(Math.min(max, (bet < rules.minBet ? 0 : bet) + v))
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="label">Your bet{humanCount > 1 ? ` (each of ${humanCount} spots)` : ''}</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-display text-3xl text-cream-50 tabular-nums">{money(bet)}</span>
            <span className="text-xs text-cream-300/50">min {money(rules.minBet)} · max {money(rules.maxBet)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-quiet px-3" onClick={() => setBet(rules.minBet)}>Min</button>
          <button className="btn-quiet px-3" onClick={() => setBet(0)}>Clear</button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Add chips">
        {CHIP_VALUES.map((v) => (
          <button key={v} onClick={() => add(v)} disabled={bet + v > max && bet >= rules.minBet} className="rounded-full transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30" aria-label={`Add ${v} dollar chip`}>
            <Chip value={v} size={46} />
          </button>
        ))}
      </div>
      {!betOk && bet > 0 && <p className="mt-2 text-xs text-ruby-400">{bet < rules.minBet ? `Table minimum is ${money(rules.minBet)}.` : bet > rules.maxBet ? `Table maximum is ${money(rules.maxBet)}.` : 'Not enough chips for that bet.'}</p>}
      <button className="btn-gold mt-4 w-full py-3.5 text-base" onClick={onDeal} disabled={!betOk || busy}>
        {again ? 'Deal next hand' : 'Deal'}
      </button>
      <p className="mt-2 text-center text-[11px] text-cream-300/45">Training chips only. No real money, ever. XP rewards good decisions, not bet size.</p>
    </div>
  )
}

const ACTION_STYLE: Record<Action, string> = {
  hit: 'bg-[#7d2a35] hover:bg-[#8f3340] text-cream-50',
  stand: 'bg-[#c9a24a] hover:bg-[#d6b05a] text-ink-950',
  double: 'bg-[#1d7a46] hover:bg-[#228a50] text-cream-50',
  split: 'bg-[#3c4f9e] hover:bg-[#465bb0] text-cream-50',
  surrender: 'bg-[#e6dccb] hover:bg-white text-ink-950',
}
const PHYSICAL_LABEL: Record<Action, [string, string]> = {
  hit: ['Tap the felt', 'Hit'], stand: ['Wave off', 'Stand'], double: ['Chips + 1 finger', 'Double'], split: ['Chips + V sign', 'Split'], surrender: ['Say “Surrender”', 'Surrender'],
}
const PITCH_LABEL: Record<Action, [string, string]> = {
  hit: ['Scratch cards', 'Hit'], stand: ['Tuck under chips', 'Stand'], double: ['Flip + add chips', 'Double'], split: ['Flip + add chips', 'Split'], surrender: ['Say “Surrender”', 'Surrender'],
}

function ActionButtons({ actions, onAction, physical, faceDown }: { actions: Action[]; onAction: (a: Action) => void; physical: boolean; faceDown: boolean }) {
  const order: Action[] = ['hit', 'stand', 'double', 'split', 'surrender']
  return (
    <div>
      {physical && <p className="mb-2 text-xs text-cream-300/60">Signal the dealer. {faceDown ? 'This is a face-down pitch game: you’re holding your cards.' : 'Face-up shoe game: don’t touch your cards.'}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {order.map((a) => {
          const on = actions.includes(a)
          const [main, sub] = physical ? (faceDown ? PITCH_LABEL[a] : PHYSICAL_LABEL[a]) : [ACTION_LABEL[a], '']
          return (
            <button
              key={a}
              onClick={() => onAction(a)}
              disabled={!on}
              title={physical ? SIGNALS[a][faceDown ? 'faceDown' : 'faceUp'] : undefined}
              className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-bold shadow-md transition active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-20 ${ACTION_STYLE[a]} ${a === 'surrender' && !on ? 'hidden sm:flex' : ''}`}
            >
              {physical && <span className="hidden overflow-hidden rounded-md sm:block"><HandSignal action={a} faceDown={faceDown} size={44} animate={false} /></span>}
              <span className="flex flex-col leading-tight">
                <span>{main}</span>
                {sub && <span className="text-[10px] font-semibold opacity-70">{sub}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InsurancePrompt({ evenMoney, venue, bet, onDecide, disabled, showHint }: { evenMoney: boolean; venue: Venue; bet: number; onDecide: (t: boolean) => void; disabled: boolean; showHint: boolean }) {
  const [hint, setHint] = useState(false)
  return (
    <div className={venue === 'online' ? 'rounded-2xl border border-gold-300/40 bg-ink-850 p-4 shadow-gold' : ''} role="group" aria-label={evenMoney ? 'Even money offer' : 'Insurance offer'}>
      <div className="font-display text-xl text-cream-50">{evenMoney ? 'Even money?' : 'Insurance?'}</div>
      <p className="mt-1 text-sm text-cream-300/70">
        {evenMoney
          ? 'You have blackjack and the dealer shows an Ace. Take a guaranteed 1:1 payout now, or wait for 3:2 (push if the dealer has blackjack)?'
          : `Insurance costs ${money(bet / 2)} (half your bet) and pays 2:1 if the dealer has blackjack.`}
        {venue === 'atlantic-city' && !evenMoney && ' To take it, you’d place chips on the insurance line. To decline, just do nothing, or say “No insurance.”'}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="btn-ghost py-3" disabled={disabled} onClick={() => onDecide(true)}>{evenMoney ? 'Take even money' : venue === 'atlantic-city' ? 'Chips on the line' : 'Yes, insure'}</button>
        <button className="btn-gold py-3" disabled={disabled} onClick={() => onDecide(false)}>{evenMoney ? 'No, play it out' : 'No insurance'}</button>
      </div>
      {showHint && (
        <button className="btn-quiet mt-2 px-2 py-1 text-xs" onClick={() => setHint((h) => !h)}><Icon name="lightbulb" size={14} /> {hint ? 'Hide' : 'Think it through'}</button>
      )}
      {hint && <p className="fade-up mt-1 rounded-xl bg-gold-400/10 px-3 py-2 text-sm text-gold-100">Insurance is a separate bet that the hole card is a ten. About 4 in 13 cards are tens, and it pays 2 to 1. Is that a good price? Work it out before you answer.</p>}
    </div>
  )
}

function CountPrompt({ ask, onChange, onSubmit }: { ask: { answer: number; guess: string; result?: boolean }; onChange: (a: { answer: number; guess: string; result?: boolean } | null) => void; onSubmit: () => void }) {
  return (
    <div>
      <div className="font-display text-xl text-cream-50">Count check</div>
      {ask.result == null ? (
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (ask.guess.trim() !== '') onSubmit() }}>
          <input autoFocus className="input" inputMode="numeric" placeholder="Running count, e.g. -3" value={ask.guess} onChange={(e) => onChange({ ...ask, guess: e.target.value.replace(/[^\d-]/g, '') })} aria-label="Your running count" />
          <button className="btn-gold" type="submit">Check</button>
        </form>
      ) : (
        <div className="mt-2">
          <p className={`text-sm font-semibold ${ask.result ? 'text-emerald-300' : 'text-ruby-400'}`}>{ask.result ? 'Correct!' : `Not quite. The running count is ${ask.answer > 0 ? '+' : ''}${ask.answer}.`}</p>
          <button className="btn-gold mt-3 w-full" onClick={() => onChange(null)}>Continue</button>
        </div>
      )}
    </div>
  )
}

function SessionSummary({ s, bankroll }: { s: SessionStats; bankroll: number }) {
  const acc = s.decisions ? s.correct / s.decisions : null
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="panel-soft p-3"><div className="label">Decision quality</div><div className="mt-1 text-2xl font-semibold text-cream-50">{acc == null ? '—' : `${Math.round(acc * 100)}%`}</div><div className="text-xs text-cream-300/60">{s.correct} of {s.decisions} correct</div></div>
        <div className="panel-soft p-3"><div className="label">Results</div><div className={`mt-1 text-2xl font-semibold ${s.net > 0 ? 'text-emerald-300' : s.net < 0 ? 'text-ruby-400' : 'text-cream-50'}`}>{money(s.net, true)}</div><div className="text-xs text-cream-300/60">{s.hands} hands · now {money(bankroll)}</div></div>
        <div className="panel-soft p-3"><div className="label">Right play, lost</div><div className="mt-1 text-2xl font-semibold text-cream-50">{s.correctLosses}</div><div className="text-xs text-cream-300/60">Bad luck, good decisions</div></div>
        <div className="panel-soft p-3"><div className="label">Wrong play, won</div><div className="mt-1 text-2xl font-semibold text-cream-50">{s.mistakeWins}</div><div className="text-xs text-cream-300/60">Lucky, but costly over time</div></div>
      </div>
      <p className="text-sm text-cream-200/75">Results and decision quality are tracked separately on purpose. Over a session, luck dominates the chip count. Over a lifetime, decisions do.</p>
      {s.mistakes.length > 0 && (
        <div>
          <div className="label mb-1.5">Mistakes this session</div>
          <ul className="divide-y divide-white/5 text-sm">
            {s.mistakes.slice(0, 8).map((m, i) => (
              <li key={i} className="flex justify-between gap-2 py-1.5"><span className="text-cream-100">{m.label}</span><span className="text-gold-100">should {m.should.replace('no-', 'decline ').replace('-', ' ')}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
