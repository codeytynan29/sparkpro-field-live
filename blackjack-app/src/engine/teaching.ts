// The Teaching Dealer. Turns a decision (and, once settled, the hand's outcome)
// into plain-English coaching. Every number quoted is computed by ev.ts from the
// actual table rules; nothing here is a typed-in statistic.
import { RANK_NAME, upcardValue, type Card } from './cards'
import { bestOption, bustChanceOnHit, dealerBustChance, formatEV, optionEVs, pct, type OptionEVs } from './ev'
import type { Decision, Outcome, PlayerHand } from './game'
import { describeHand, handValue } from './hand'
import { blackjackMultiplier, type TableRules } from './rules'
import { ACTION_LABEL, upcardLabel, type Action, type Recommendation } from './strategy'

export type Verdict = 'correct-win' | 'correct-loss' | 'correct-push' | 'mistake-win' | 'mistake-loss' | 'mistake-push'

export function verdictFor(correct: boolean, net: number): Verdict {
  const result = net > 0 ? 'win' : net < 0 ? 'loss' : 'push'
  return `${correct ? 'correct' : 'mistake'}-${result}` as Verdict
}

export const VERDICT_TITLE: Record<Verdict, string> = {
  'correct-win': 'Right play, and it paid',
  'correct-loss': 'Bad luck, good decision',
  'correct-push': 'Right play, a push',
  'mistake-win': 'You won, but that was the wrong play',
  'mistake-loss': 'Wrong play, and it cost you',
  'mistake-push': 'Wrong play, saved by a push',
}

/** Small rotating openers so the dealer doesn't sound like a form letter. */
const OPENERS: Record<Verdict, string[]> = {
  'correct-win': ['Beautiful.', 'That’s how it’s done.', 'Textbook.', 'Now that’s discipline.'],
  'correct-loss': ['Bad luck, good decision.', 'Don’t let the outcome fool you.', 'You played that exactly right. The cards just didn’t cooperate.', 'Tough hand, perfect play.'],
  'correct-push': ['Nobody wins, but you played it right.', 'A push, and the right decision.'],
  'mistake-win': ['You got paid, but let’s talk.', 'The chips came your way, but that play will cost you over time.', 'Lucky one. Here’s why it was still a mistake.'],
  'mistake-loss': ['Easy there, cowboy.', 'Let’s rewind that one.', 'That one’s worth learning from.'],
  'mistake-push': ['A push bailed you out there.', 'No harm done this time, but let’s fix that play.'],
}

function pickLine(lines: string[], salt: number) {
  return lines[Math.abs(salt) % lines.length]
}

function upName(up: Card) {
  const v = upcardValue(up)
  return v === 11 ? 'an Ace' : v === 10 ? 'a 10' : v === 8 ? 'an 8' : `a ${v}`
}

const ARTICLE: Record<string, string> = { hit: 'hit', stand: 'stand', double: 'double down', split: 'split', surrender: 'surrender' }

/** Why basic strategy says what it says for this situation. Always rule-aware. */
export function explainRecommendation(cards: readonly Card[], dealerUp: Card, rec: Recommendation, rules: TableRules): string {
  const v = handValue(cards)
  const up = upcardValue(dealerUp)
  const db = dealerBustChance(dealerUp, rules.dealerHitsSoft17)
  const bust = bustChanceOnHit(cards)
  const weak = up >= 2 && up <= 6
  const dealerLine = weak
    ? `The dealer is showing ${upName(dealerUp)}, a weak card: they must keep drawing to 17 and bust about ${pct(db)} of the time from here.`
    : `The dealer is showing ${upName(dealerUp)}, a strong card: they bust only about ${pct(db)} of the time from here, so expect a finished hand of 17 or better.`

  if (rec.kind === 'pair') {
    const pv = rec.rowKey
    if (pv === 11) return 'Always split Aces. One Ace is a great start to a hand; two Aces together are just a clumsy soft 12. Splitting gives you two shots at 21.'
    if (pv === 8) {
      if (rec.action === 'surrender') return `Hard 16 is the worst total in blackjack. Against an Ace on a table where the dealer hits soft 17, surrendering 8s saves more than splitting does.`
      return 'Always split 8s. Together they make 16, the worst hand in the game. Apart, each 8 is a decent start, even against a strong dealer card, so splitting loses less money over time.'
    }
    if (pv === 9 && rec.action === 'split') return `Split 9s here. 18 is good but not great against ${upName(dealerUp)}, and two hands starting with a 9 do better.`
    if (rec.code === 'P' && weak) return `Split here. ${dealerLine} Putting more money out while the dealer is vulnerable is how you profit from their weakness.${rules.doubleAfterSplit ? ' Double after split makes this even better.' : ''}`
    if (rec.code === 'P') return `Split here. Each card starts a better hand on its own than the pair does as a total against ${upName(dealerUp)}.`
  }
  if (rec.code === '-' || rec.kind !== 'pair') {
    // Explanations by total.
  }
  if (cards.length === 2 && cards[0].rank === cards[1].rank && cards[0].rank === '5') {
    if (rec.action === 'double') return 'Never split 5s. A pair of 5s is a hard 10, one of the best doubling hands there is.'
    return 'Never split 5s. Play them as a hard 10.'
  }
  if (cards.length === 2 && v.total === 20 && !v.soft) return 'Never split tens. 20 is a great hand. Standing wins far more often than starting two new hands.'
  if (rec.code === 'Rh' || rec.code === 'Rs' || rec.code === 'Rp') {
    if (rec.action === 'surrender') return `Surrender. ${v.total} against ${upName(dealerUp)} loses more than half the time no matter how you play it. Giving up half your bet now is cheaper than playing it out.`
    return `Surrender would be best here, but it isn’t available on this hand, so ${ARTICLE[rec.action]} instead.`
  }
  if (v.soft) {
    if (rec.action === 'double') return `Double this soft ${v.total}. A soft hand can’t bust with one card, and ${dealerLine.charAt(0).toLowerCase() + dealerLine.slice(1)} Get more money out while you have the advantage.`
    if (rec.action === 'stand') {
      if (v.total === 18) return `Stand on soft 18 here. 18 is a decent total against ${upName(dealerUp)}.${rec.fallbackFrom === 'double' ? ' You’d double if you could, but you can’t on this hand.' : ''}`
      return `Stand. Soft ${v.total} is already a strong hand.`
    }
    if (v.total === 18) return `Hit soft 18 against ${upName(dealerUp)}. It feels wrong, but 18 is an underdog against a dealer 9, 10, or Ace, and a soft hand can’t bust on the next card.`
    return `Hit. A soft ${v.total} can’t bust on the next card, so you can improve it for free.${rec.fallbackFrom === 'double' ? ' You’d double if you could, but you can’t on this hand.' : ''}`
  }
  if (v.total <= 8) return `Hit. You can’t bust a hard ${v.total} with one card, so there is no risk in drawing.`
  if (rec.action === 'double') {
    return `Double down. With ${v.total} you are more likely to finish strong than the dealer is from ${upName(dealerUp)}. When you have the edge, get more money on the table.`
  }
  if (v.total >= 9 && v.total <= 11 && rec.action === 'hit') {
    if (rec.fallbackFrom === 'double') return `Hit. Basic strategy would double here, but doubling isn’t allowed on this hand. You can’t bust ${v.total}, so take a card.`
    return `Hit, don’t double. Against ${upName(dealerUp)} your ${v.total} isn’t strong enough to put more money out, but you can’t bust it, so take a card.`
  }
  if (v.total >= 17) return `Stand. Any card above ${21 - v.total} busts a hard ${v.total} (about ${pct(bust)} of the deck). Make the dealer beat you.`
  if (v.total === 12 && (up === 2 || up === 3)) return `Hit 12 against ${upName(dealerUp)}. Only a 10-value card busts you (about ${pct(bust)}), and the dealer busts just ${pct(db)} of the time with ${upName(dealerUp)} up.`
  if (rec.action === 'stand') return `Stand. ${dealerLine} Hitting a hard ${v.total} busts about ${pct(bust)} of the time. Let the dealer take the risk.`
  return `Hit. ${dealerLine} Standing on ${v.total} only wins when the dealer busts, so you need to improve, even though one card busts you about ${pct(bust)} of the time.`
}

export interface EvRow {
  action: Action
  ev: number
  best: boolean
  chosen: boolean
}

export function evTable(cards: readonly Card[], dealerUp: Card, rules: TableRules, allowed: readonly Action[], chosen?: Action): EvRow[] {
  const evs: OptionEVs = optionEVs(cards, dealerUp, rules)
  const best = bestOption(evs, allowed)
  return allowed
    .map((a) => ({ action: a, ev: a === 'split' ? evs.split ?? -1 : evs[a], best: a === best.action, chosen: a === chosen }))
    .sort((x, y) => y.ev - x.ev)
}

export interface DecisionFeedback {
  correct: boolean
  title: string
  message: string
  why: string
  evRows: EvRow[]
  /** True when EV says the two options are within 1% of a bet: a close call. */
  closeCall: boolean
}

/** Immediate feedback right after a decision (outcome not yet known). */
export function feedbackForDecision(d: Decision, rules: TableRules): DecisionFeedback {
  if (d.kind === 'insurance') return insuranceFeedback(d, rules)
  const rec = d.rec!
  const rows = evTable(d.cards, d.dealerUp, rules, d.allowed, d.action as Action)
  const chosen = rows.find((r) => r.chosen)
  const recRow = rows.find((r) => r.action === rec.action)
  const close = !!chosen && !!recRow && Math.abs(chosen.ev - recRow.ev) < 0.01
  const hand = describeHand(d.cards)
  const why = explainRecommendation(d.cards, d.dealerUp, rec, rules)
  if (d.correct) {
    return {
      correct: true,
      title: `${ACTION_LABEL[rec.action]}: correct`,
      message: `${hand} against ${upName(d.dealerUp)}: ${ACTION_LABEL[rec.action].toLowerCase()} is the basic strategy play.`,
      why, evRows: rows, closeCall: close,
    }
  }
  const cost = chosen && recRow ? recRow.ev - chosen.ev : 0
  return {
    correct: false,
    title: `Basic strategy says ${ACTION_LABEL[rec.action].toLowerCase()}`,
    message: `${hand} against ${upName(d.dealerUp)}: you chose to ${ARTICLE[d.action as Action]}. The better play is to ${ARTICLE[rec.action]}.${cost > 0.0005 ? ` Over time that choice costs about ${formatEV(cost).replace('+', '')} of your bet every time this hand comes up.` : ''}`,
    why, evRows: rows, closeCall: close,
  }
}

function insuranceFeedback(d: Decision, rules: TableRules): DecisionFeedback {
  const evenMoney = d.action === 'even-money' || d.action === 'no-even-money'
  const took = d.action === 'insurance' || d.action === 'even-money'
  const ev = -1 / 13
  if (evenMoney) {
    const m = blackjackMultiplier(rules)
    const declineValue = (9 / 13) * m
    const takeIsRight = declineValue < 1
    const why = `Even money is insurance in disguise: it locks in a 1 to 1 win on your blackjack. If you decline, you get paid ${rules.blackjackPayout} whenever the dealer doesn’t have blackjack (about 9 times in 13) and push when they do. That averages ${declineValue.toFixed(2)} bets, versus exactly 1.00 for even money. ${takeIsRight ? 'At a 6:5 table the reduced payout makes even money the better choice.' : 'At a 3:2 table, declining is worth more over time.'}`
    const correct = takeIsRight ? took : !took
    return {
      correct,
      title: correct ? (took ? 'Took even money: correct here' : 'Declined even money: correct') : took ? 'Even money: not the best choice here' : 'Even money was the better choice here',
      message: correct ? 'Good read of the table rules.' : 'That offer depends on the blackjack payout. Here’s the math.',
      why, evRows: [], closeCall: false,
    }
  }
  const why = `Insurance is a side bet that the dealer’s hole card is a ten. Only 4 of the 13 ranks are tens, so it wins about 31% of the time and pays 2:1. That averages a loss of about ${pct(-ev, 1)} of every insurance bet. Unless you are counting cards and the true count is +3 or higher, decline it.`
  return {
    correct: !took,
    title: took ? 'Insurance: not recommended' : 'Declined insurance: correct',
    message: took ? 'That insurance offer looks tempting, doesn’t it? Here’s why the math usually says no.' : 'Good. You turned down a bet that favors the house.',
    why, evRows: [], closeCall: false,
  }
}

export interface HandBreakdown {
  handId: string
  cards: Card[]
  dealer: Card[]
  outcome: Outcome
  net: number
  decisions: { decision: Decision; feedback: DecisionFeedback }[]
  /** Null when the hand needed no decisions (a natural, or a split Ace). */
  verdict: Verdict | null
  title: string
  dealerSays: string
  lesson: string
}

export function outcomeText(o: Outcome, dealer: Card[]): string {
  const dv = handValue(dealer)
  switch (o) {
    case 'blackjack': return 'Blackjack! Paid at the blackjack rate.'
    case 'win': return dv.bust ? `Dealer busts with ${dv.total}. You win.` : `Dealer finishes with ${dv.total}. You win.`
    case 'lose': return `Dealer finishes with ${dv.total}. You lose.`
    case 'push': return dv.blackjack ? 'Both have blackjack. Push.' : `Dealer finishes with ${dv.total}. Push.`
    case 'bust': return 'You bust.'
    case 'surrender': return 'You surrendered and got half your bet back.'
    case 'dealer-blackjack': return 'Dealer has blackjack.'
    case 'even-money': return 'Even money taken: paid 1 to 1.'
  }
}

/** Full breakdown for a settled hand. */
export function breakdownHand(hand: PlayerHand, dealer: Card[], decisions: Decision[], rules: TableRules, salt = 0): HandBreakdown {
  const mine = decisions.filter((d) => d.handId === hand.id)
  const items = mine.map((d) => ({ decision: d, feedback: feedbackForDecision(d, rules) }))
  const net = hand.net ?? 0
  const outcome = hand.outcome ?? 'push'
  const playDecisions = mine.filter((d) => d.kind === 'play')
  if (mine.length === 0) {
    const lesson = outcome === 'blackjack'
      ? `A natural pays ${rules.blackjackPayout}. ${rules.blackjackPayout === '6:5' ? 'At 6:5 that’s noticeably less than the standard 3:2. Look for 3:2 tables.' : 'That 3:2 payout is one of the few places the player gets paid more than even money.'}`
      : outcome === 'dealer-blackjack'
        ? 'The dealer checked and had blackjack, so the hand ended before you could act. Nothing to learn from this one except that it happens about once every 21 hands.'
        : outcome === 'push' ? 'Two naturals push.' : 'No decisions on this hand.'
    return { handId: hand.id, cards: hand.cards, dealer, outcome, net, decisions: items, verdict: null, title: outcomeText(outcome, dealer), dealerSays: outcomeText(outcome, dealer), lesson }
  }
  const correct = items.every((i) => i.feedback.correct)
  const verdict = verdictFor(correct, net)
  const opener = pickLine(OPENERS[verdict], salt + hand.cards.length)
  const firstWrong = items.find((i) => !i.feedback.correct)
  const key = firstWrong ?? items[items.length - 1]
  let dealerSays: string
  if (verdict === 'correct-loss') {
    dealerSays = `${opener} ${key.feedback.why} Losing a hand you played right is part of the game. Over thousands of hands, these decisions are what keep your losses smallest.`
  } else if (verdict === 'mistake-win') {
    dealerSays = `${opener} ${key.feedback.message} ${key.feedback.why} Winning this time doesn’t make it right. Make that play every time and the house wins more of your money in the long run.`
  } else if (verdict.startsWith('mistake')) {
    dealerSays = `${opener} ${key.feedback.message} ${key.feedback.why}`
  } else {
    dealerSays = `${opener} ${key.feedback.why}`
  }
  if (key.feedback.closeCall && !key.feedback.correct) dealerSays += ' This one is a close call, though; the difference is under 1% of your bet.'
  const lesson = firstWrong
    ? playDecisions.length && firstWrong.decision.kind === 'play'
      ? `Next time: ${firstWrong.decision.rec ? sentenceFor(firstWrong.decision) : ''}`
      : firstWrong.decision.action === 'no-even-money' ? 'Next time: at a 6:5 table, take even money on a blackjack against an Ace.' : firstWrong.decision.action === 'even-money' ? 'Next time: at a 3:2 table, decline even money.' : 'Next time: decline insurance unless you’re counting and the true count is +3 or higher.'
    : 'Keep making that play. Good decisions win out over time, even when single hands don’t.'
  return { handId: hand.id, cards: hand.cards, dealer, outcome, net, decisions: items, verdict, title: VERDICT_TITLE[verdict], dealerSays, lesson }
}

function sentenceFor(d: Decision): string {
  const r = d.rec!
  const hand = describeHand(d.cards).toLowerCase()
  return `with ${hand} against a dealer ${upcardLabel(r.upcard)}, ${ARTICLE[r.action]}.`
}

/** A hint shown in Teacher mode before the player decides. */
export function hintFor(cards: readonly Card[], dealerUp: Card, rules: TableRules): string {
  const v = handValue(cards)
  const up = upcardValue(dealerUp)
  const db = dealerBustChance(dealerUp, rules.dealerHitsSoft17)
  const parts: string[] = []
  parts.push(`You have ${describeHand(cards).toLowerCase()}.`)
  parts.push(up <= 6 ? `The dealer shows ${upName(dealerUp)}: a bust card. They break about ${pct(db)} of the time.` : `The dealer shows ${upName(dealerUp)}: a strong card. They break only about ${pct(db)} of the time.`)
  if (v.soft) parts.push('Soft hands can’t bust on the next card.')
  else if (v.total >= 12 && v.total <= 16) parts.push(`If you hit, about ${pct(bustChanceOnHit(cards))} of cards would bust you.`)
  if (cards.length === 2 && cards[0].rank === cards[1].rank) parts.push(`It’s a pair of ${RANK_NAME[cards[0].rank]}s: think about whether each card is better on its own.`)
  return parts.join(' ')
}
