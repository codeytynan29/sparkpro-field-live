import type { Venue } from '../state/progress'
import type { Action } from '../engine/strategy'
import { pick, type Rng } from '../engine/rng'

export const VENUES: { id: Venue; name: string; short: string; blurb: string }[] = [
  { id: 'practice', name: 'Practice Table', short: 'Practice', blurb: 'The teaching dealer coaches every decision as you make it. Hints on request.' },
  { id: 'atlantic-city', name: 'Atlantic City Floor', short: 'Atlantic City', blurb: 'Just you and the dealer, casino style: hand signals, real dealer procedure and patter, coaching after each hand.' },
  { id: 'online', name: 'Online Casino', short: 'Online', blurb: 'Buttons, pop-ups and a faster pace, like a digital table. Coaching after each hand.' },
]

type Line = string[]

const AC = {
  bets: ['Place your bets, folks.', 'Bets down, please.', 'Get those bets in.'],
  noMore: ['No more bets.', 'All set? Here we go.'],
  insurance: ['Insurance? Insurance is open.', 'Ace up. Anybody want insurance?'],
  peekNo: ['Dealer checks… nobody home. Let’s play.', 'No blackjack. Play on.'],
  peekYes: ['Dealer has blackjack.', 'Sorry, folks. Blackjack.'],
  turn: ['What would you like?', 'Your action.', 'Up to you.'],
  bust: ['Too many.', 'That’s a bust.'],
  dealerBust: ['Dealer breaks! Paying everybody still in.', 'Too many for the dealer. Winners all around.'],
  shuffle: ['Shuffle up. Fresh shoe.', 'Cut card’s out. Shuffling.'],
}

const ONLINE = {
  bets: ['Place your bet.', 'Bets open.'],
  noMore: ['Bets closed.'],
  insurance: ['Insurance offered. Choose Yes or No.'],
  peekNo: ['Dealer does not have blackjack.'],
  peekYes: ['Dealer has blackjack.'],
  turn: ['Make your decision.'],
  bust: ['Bust.'],
  dealerBust: ['Dealer busts.'],
  shuffle: ['New shoe.'],
}

const PRACTICE = {
  bets: ['Set your bet whenever you’re ready. No rush here.', 'Pick a bet and deal when you’re ready.'],
  noMore: ['Here come the cards.'],
  insurance: ['I’m showing an Ace, so I’ll offer insurance. Think about it before you answer.'],
  peekNo: ['I checked my hole card: no blackjack. Your move.'],
  peekYes: ['I peeked, and I have blackjack. Hands end right here.'],
  turn: ['Your decision. Ask for a hint if you want one.', 'Take your time.'],
  bust: ['Over 21. That one’s gone.'],
  dealerBust: ['I bust! Everyone still standing wins.'],
  shuffle: ['Cut card came out, so I shuffled a fresh shoe.'],
}

export type DealerCue = keyof typeof AC

export function dealerLine(venue: Venue, cue: DealerCue, rng: Rng): string {
  const set = venue === 'online' ? ONLINE : venue === 'atlantic-city' ? AC : PRACTICE
  return pick(rng, set[cue] as Line)
}

/** What the dealer says when a player signals, in a physical game. */
export function signalLine(action: Action, faceDown: boolean): string {
  if (faceDown) {
    return {
      hit: 'Scratches for a card.',
      stand: 'Tucks the cards under the chips: stands.',
      double: 'Flips the cards and puts out a second bet: doubling.',
      split: 'Turns over the pair and matches the bet: splitting.',
      surrender: '“Surrender.” Dealer takes half the bet.',
    }[action]
  }
  return {
    hit: 'Taps the felt: card coming.',
    stand: 'Waves off: stands.',
    double: 'Chips beside the bet, one finger up: doubling down, one card.',
    split: 'Matching bet, two fingers in a V: splitting.',
    surrender: '“Surrender.” Line drawn behind the bet. Dealer takes half.',
  }[action]
}

export const SIGNALS: Record<Action, { faceUp: string; faceDown: string; verbal: string }> = {
  hit: { faceUp: 'Tap the felt behind your cards with a finger, or beckon toward yourself.', faceDown: 'Lightly scratch the edges of your cards toward you on the felt.', verbal: '“Hit.” / “Card.”' },
  stand: { faceUp: 'Wave your hand flat, palm down, side to side over your cards.', faceDown: 'Slide your cards face down under your chips. Don’t touch the chips.', verbal: '“Stand.” / “I’m good.”' },
  double: { faceUp: 'Place an equal bet beside (not on) your original bet, then hold up one finger.', faceDown: 'Turn your cards face up, then place an equal bet beside the original.', verbal: '“Double.”' },
  split: { faceUp: 'Place an equal bet beside your original bet, then make a V with two fingers.', faceDown: 'Turn your cards face up, then place an equal bet beside the original.', verbal: '“Split.”' },
  surrender: { faceUp: 'Say “Surrender” clearly. Many dealers also accept drawing a line behind your bet with a finger.', faceDown: 'Say “Surrender” and place your cards face up.', verbal: '“Surrender.”' },
}
