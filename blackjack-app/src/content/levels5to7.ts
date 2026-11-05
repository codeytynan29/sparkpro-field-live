import type { Level } from './types'

export const LEVEL_5: Level = {
  n: 5,
  title: 'Basic Strategy Mastery',
  tagline: 'The mathematically best play for every hand, for your table’s rules.',
  lessons: [
    {
      id: 'l5-what',
      title: 'What Basic Strategy Is',
      summary: 'A chart computed by simulating every hand, for every rule set.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Not a hunch, a calculation',
          body: [
            'Basic strategy is the set of decisions that loses the least money (or wins the most) for every combination of your hand and the dealer’s upcard. It was first worked out in the 1950s and has since been confirmed by computers simulating billions of hands.',
            'Played perfectly, it brings the house edge on a good table down to around **half a percent**. Played by gut feel, players typically give the house several percent.',
            'It doesn’t guarantee you’ll win a session. Nothing does. It guarantees each decision is the best one available.',
          ],
        },
        {
          type: 'text',
          title: 'It depends on the rules',
          body: [
            'The best play changes slightly with the rules: number of decks, whether the dealer hits soft 17, double after split, surrender. This app builds the chart for whatever table you’re playing, and the teaching dealer always grades you against *that* chart.',
          ],
        },
        { type: 'widget', widget: 'strategy-chart', title: 'Your chart', body: 'This chart follows your current table rules. Tap a cell for the reasoning.' },
      ],
    },
    {
      id: 'l5-hard',
      title: 'Hard Totals',
      summary: '8 through 17: the backbone of the chart.',
      minutes: 6,
      steps: [
        {
          type: 'text',
          title: 'The shape of it',
          body: [
            '**8 or less:** always hit.',
            '**9:** double against 3–6, otherwise hit.',
            '**10:** double against 2–9, otherwise hit.',
            '**11:** double against 2–10 (and against an Ace in most games), otherwise hit.',
            '**12:** stand against 4–6, otherwise hit.',
            '**13–16:** stand against 2–6, otherwise hit (surrender some 15s and 16s if allowed).',
            '**17+:** stand.',
          ],
        },
        { type: 'decision', cards: '10S 2H', dealerUp: '2D' },
        { type: 'decision', cards: '9S 4H', dealerUp: '2D' },
        { type: 'decision', cards: '10S 6H', dealerUp: '7D', rules: { lateSurrender: false } },
        { type: 'decision', cards: '6S 4H', dealerUp: '9D' },
        { type: 'decision', cards: '7S 5H', dealerUp: '6D' },
        { type: 'widget', widget: 'decision-drill', title: 'Drill: hard totals', props: { category: 'hard', count: 10 } },
      ],
    },
    {
      id: 'l5-soft',
      title: 'Soft Totals',
      summary: 'Hands with an Ace counted as 11.',
      minutes: 6,
      steps: [
        {
          type: 'text',
          title: 'Use the Ace’s flexibility',
          body: [
            'Soft hands can’t bust on one card, so you can be aggressive with them.',
            '**Soft 13–14 (A-2, A-3):** double against 5–6, otherwise hit.',
            '**Soft 15–16 (A-4, A-5):** double against 4–6, otherwise hit.',
            '**Soft 17 (A-6):** double against 3–6, otherwise hit. Never stand on soft 17.',
            '**Soft 18 (A-7):** double against 2–6 when allowed (3–6 at S17 tables), stand against 7–8, **hit against 9, 10, Ace.**',
            '**Soft 19+:** stand (except doubling A-8 against a 6 when the dealer hits soft 17).',
          ],
        },
        { type: 'decision', cards: 'AS 7H', dealerUp: '9D' },
        { type: 'decision', cards: 'AS 6H', dealerUp: '7D' },
        { type: 'decision', cards: 'AS 3H', dealerUp: '5D' },
        { type: 'decision', cards: 'AS 7H', dealerUp: '3D' },
        { type: 'widget', widget: 'decision-drill', title: 'Drill: soft totals', props: { category: 'soft', count: 10 } },
      ],
    },
    {
      id: 'l5-pairs',
      title: 'Pair Splitting',
      summary: 'When two hands beat one.',
      minutes: 6,
      steps: [
        {
          type: 'text',
          title: 'The pair chart (double after split allowed)',
          body: [
            '**A-A, 8-8:** always split.',
            '**10-10:** never split. **5-5:** never split; play as 10.',
            '**9-9:** split against 2–6 and 8–9; stand against 7, 10, Ace.',
            '**7-7:** split against 2–7.',
            '**6-6:** split against 2–6.',
            '**4-4:** split against 5–6 only.',
            '**2-2, 3-3:** split against 2–7.',
            'Without double after split, you split 2s, 3s, 4s and 6s less often. The app’s chart adjusts automatically.',
          ],
        },
        { type: 'decision', cards: '9S 9H', dealerUp: '9D' },
        { type: 'decision', cards: '6S 6H', dealerUp: '7D' },
        { type: 'decision', cards: '2S 2H', dealerUp: '7D' },
        { type: 'decision', cards: '4S 4H', dealerUp: '6D' },
        { type: 'widget', widget: 'decision-drill', title: 'Drill: pairs', props: { category: 'pair', count: 10 } },
      ],
    },
    {
      id: 'l5-doubles',
      title: 'Doubling Decisions',
      summary: 'The plays that win back the most.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'Where the money is',
          body: [
            'Doubling is your chance to get more money on the table exactly when you’re the favorite. Most beginners **under-double**. That’s a hidden leak.',
            'If the table won’t let you double (after hitting, or with a 10-11-only rule), fall back: hard doubles become hits, and soft 18 doubles become stands.',
          ],
        },
        { type: 'widget', widget: 'ev-compare', title: 'Soft 18 against a 4', props: { cards: 'AS 7H', up: '4D' } },
        { type: 'widget', widget: 'decision-drill', title: 'Drill: doubling spots', props: { category: 'double', count: 10 } },
      ],
    },
    {
      id: 'l5-surrender',
      title: 'Surrender Decisions',
      summary: 'Which hands to give up, precisely.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Only a handful',
          body: [
            'With late surrender, you surrender hard 16 against 9, 10 and Ace, and hard 15 against 10 (six decks, S17).',
            'Under H17 add hard 15 vs Ace, hard 17 vs Ace, and 8-8 vs Ace.',
            'Fewer decks change it slightly. The chart tab shows the exact cells for your rules.',
          ],
        },
        { type: 'widget', widget: 'ev-compare', title: '16 against a 10', props: { cards: '10S 6H', up: 'KD' } },
        { type: 'widget', widget: 'decision-drill', title: 'Drill: surrender spots', props: { category: 'surrender', count: 8, rules: { lateSurrender: true } } },
      ],
    },
    {
      id: 'l5-upcard',
      title: 'Reading the Dealer’s Upcard',
      summary: 'Bust cards, pat cards, and why 7 is the line.',
      minutes: 4,
      steps: [
        { type: 'widget', widget: 'bust-table', title: 'Bust rate by upcard', body: 'Computed for your table’s soft-17 rule.' },
        {
          type: 'text',
          title: 'Weak and strong',
          body: [
            '**2 through 6 are “bust cards.”** The dealer will often have to hit a stiff total (12–16) and bust. Stand on your stiffs and double more.',
            '**7 through Ace are strong.** Assume the dealer will make a hand. Your 12–16 needs improving.',
            'The 2 and 3 are the weakest of the weak cards, which is why 12 is still a hit against them.',
          ],
        },
        {
          type: 'quiz',
          q: 'Which dealer upcard busts most often?',
          options: ['2', '6', '10', 'Ace'],
          answer: 1,
          explain: 'The 5 and 6 are the dealer’s worst cards; the 6 busts most often under standard rules.',
        },
      ],
    },
    {
      id: 'l5-rules',
      title: 'How Rules Change Strategy',
      summary: 'Decks, soft 17, DAS, surrender.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'The main differences',
          body: [
            '**Dealer hits soft 17:** double 11 against an Ace, double soft 18 against a 2, double soft 19 against a 6, and more surrenders.',
            '**No double after split:** split 2s, 3s, 4s and 6s less often.',
            '**Single and double deck:** double more (hard 9 against a 2, hard 8 against 5–6 in single deck, 11 against an Ace).',
            '**6:5 payout:** doesn’t change your hit/stand decisions, but it does flip the even money decision.',
          ],
        },
        { type: 'widget', widget: 'strategy-chart', title: 'Compare charts', body: 'Change the rules and watch cells change.', props: { editable: true } },
      ],
    },
  ],
}

export const LEVEL_6: Level = {
  n: 6,
  title: 'Blackjack Mathematics',
  tagline: 'Probability, expected value, house edge, variance and bankroll.',
  lessons: [
    {
      id: 'l6-probability',
      title: 'Probability at the Table',
      summary: 'Thirteen ranks, four of them tens.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Counting outcomes',
          body: [
            'Probability is just *how often something happens out of all the ways it could go*. A deck has 13 ranks, so the next card is any particular rank about 1 time in 13 (7.7%).',
            'Ten-value cards are 4 ranks of 13, so about **31%** of cards. That single fact explains a lot: why dealer 10s are strong, why 11 is a great double, and why insurance is a bad bet.',
            'A blackjack needs an Ace and a ten in either order: 2 × (1/13) × (4/13) ≈ **4.7%**, or about one hand in 21.',
          ],
        },
        {
          type: 'quiz',
          q: 'Roughly how often are you dealt a blackjack?',
          options: ['1 in 5 hands', '1 in 21 hands', '1 in 100 hands', '1 in 52 hands'],
          answer: 1,
          explain: '≈ 4.7% of hands.',
        },
      ],
    },
    {
      id: 'l6-bust',
      title: 'Bust Probability',
      summary: 'Yours, and the dealer’s.',
      minutes: 4,
      steps: [
        { type: 'widget', widget: 'player-bust', title: 'Your bust chance on one hit' },
        { type: 'widget', widget: 'bust-table', title: 'The dealer’s bust chance' },
        {
          type: 'text',
          title: 'Putting them together',
          body: [
            'Hitting hard 16 busts you about 62% of the time. That sounds awful, and it is. But against a 10, standing on 16 only wins when the dealer busts, about 23% of the time. Both options are bad; hitting is slightly less bad.',
            'That “least bad” thinking is how basic strategy works. It’s comparing options, not chasing good ones.',
          ],
        },
      ],
    },
    {
      id: 'l6-ev',
      title: 'Expected Value',
      summary: 'The average result of a decision, repeated forever.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'What EV means',
          body: [
            '**Expected value (EV)** is what a decision is worth on average if you made it thousands of times. It’s written as a percent of your bet: −54% means you’d lose about 54 cents per dollar on average.',
            'Every basic strategy decision is simply the option with the highest EV. Sometimes all options are negative. You still pick the best one.',
          ],
        },
        { type: 'widget', widget: 'ev-compare', title: '16 against a 10', body: 'Computed values for each option.', props: { cards: '10S 6H', up: 'KD' } },
        { type: 'widget', widget: 'ev-compare', title: '11 against a 6', props: { cards: '6S 5H', up: '6D' } },
        {
          type: 'quiz',
          q: 'All of a hand’s options have negative EV. What do you do?',
          options: ['Pick the one closest to zero', 'Stand, to avoid risk', 'Surrender every time', 'Pick at random'],
          answer: 0,
          explain: 'The best option loses the least. That’s still the best option.',
        },
      ],
    },
    {
      id: 'l6-house-edge',
      title: 'House Edge',
      summary: 'Where the casino’s advantage comes from, and how rules move it.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'The source',
          body: [
            'The house edge in blackjack comes almost entirely from one rule: **players bust first.** When you both bust, you lose.',
            'Players claw some of that back with things the dealer can’t do: the 3:2 blackjack bonus, doubling, splitting, surrender, and standing on stiff hands.',
          ],
        },
        { type: 'widget', widget: 'house-edge', title: 'Change the rules', body: 'The edge is computed from scratch for each combination.' },
        {
          type: 'quiz',
          q: 'Which rule change hurts the player the most?',
          options: ['Dealer hits soft 17', 'No surrender', 'Blackjack pays 6:5', 'No double after split'],
          answer: 2,
          explain: '6:5 costs about 1.4%, several times more than any of the others.',
        },
      ],
    },
    {
      id: 'l6-payout',
      title: 'The Blackjack Payout',
      summary: '3:2 vs. 6:5, in real dollars.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'Small print, big cost',
          body: [
            'At 3:2, a $10 blackjack pays $15. At 6:5, it pays $12.',
            'You get a blackjack about once every 21 hands, so 6:5 costs $3 every 21 hands at $10 a hand, or about **1.4% of everything you bet**. That roughly *triples* the house edge of a well-played game.',
          ],
        },
        { type: 'widget', widget: 'payout-calc', title: 'Payout calculator', props: { mode: 'blackjack' } },
      ],
    },
    {
      id: 'l6-variance',
      title: 'Variance',
      summary: 'Why perfect play can still lose ten hands in a row.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'Short-term swings',
          body: [
            'The house edge is small, but the results of individual hands swing hard. Doubles and splits make it swingier. Over a few hundred hands, luck dwarfs skill.',
            'That’s why **you can’t judge a decision by its result.** A correct play that loses is still correct. A wrong play that wins is still wrong.',
          ],
        },
        { type: 'widget', widget: 'variance-sim', title: 'Simulate a hundred sessions', body: 'Each session is 100 hands of perfect basic strategy, dealt from real shuffled shoes.' },
      ],
    },
    {
      id: 'l6-bankroll',
      title: 'Risk of Ruin & Bankroll',
      summary: 'How big a bankroll you need for the swings.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'Bankroll in betting units',
          body: [
            'Think of your money in **units**: your typical bet. $500 at $25 a hand is 20 units, which is not much against blackjack’s swings.',
            '**Risk of ruin** is the chance you lose the whole bankroll before you stop. With a house edge, if you play forever, it eventually reaches 100%. What you control is how much you bring, how big you bet, and how long you play.',
          ],
        },
        { type: 'widget', widget: 'ruin-sim', title: 'How long does a bankroll last?', body: 'Simulated with basic strategy over real shoes.' },
        {
          type: 'text',
          title: 'Practical rules',
          body: [
            'Decide your session budget **before** you sit down, and treat it as the cost of entertainment.',
            'Keep bets small relative to your budget. Never raise bets to win back losses.',
            'Set a time limit. A small edge per hand adds up with more hands.',
          ],
          tip: 'If gambling stops being fun, stop. In the US, call or text 1-800-GAMBLER for free, confidential help.',
        },
      ],
    },
    {
      id: 'l6-composition',
      title: 'Deck Composition',
      summary: 'Which cards help you, which help the dealer.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Not all cards are equal',
          body: [
            '**Tens and Aces help the player.** They make blackjacks (paid 3:2 to you, only even money to the dealer), strong doubles, and dealer busts.',
            '**Small cards (2–6) help the dealer.** They let the dealer turn stiff hands into 17–21 without busting.',
            'Remove small cards from a shoe and the remaining cards are richer in tens: better for you. That’s the entire idea behind card counting.',
          ],
        },
        { type: 'widget', widget: 'removal-effects', title: 'Effect of removing one card', body: 'Computed by changing the deck and recalculating the game.' },
      ],
    },
    {
      id: 'l6-casino',
      title: 'Why the Casino Wins',
      summary: 'Putting it together.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'The honest summary',
          body: [
            'Even perfect basic strategy leaves a small house edge. Over enough hands, the casino wins.',
            'Rules (6:5, H17), side bets, speed, and mistakes all push the edge up. Good rules, perfect strategy and modest bets keep it as small as possible.',
            'Treat blackjack as entertainment with a known price, and make every decision the right one. That’s what owning the table really means.',
          ],
        },
        {
          type: 'quiz',
          q: 'Which of these does NOT reduce the house edge?',
          options: ['Playing perfect basic strategy', 'Choosing 3:2 tables', 'Raising your bet after a loss', 'Choosing S17 tables'],
          answer: 2,
          explain: 'Bet size doesn’t change the edge. Chasing losses just puts more money exposed to it.',
        },
      ],
    },
  ],
}

export const LEVEL_7: Level = {
  n: 7,
  title: 'Advanced Strategy & Card Counting',
  tagline: 'Hi-Lo, true count, deviations, and what casinos do about it.',
  lessons: [
    {
      id: 'l7-why',
      title: 'Why Counting Works',
      summary: 'Blackjack has memory. Most games don’t.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Dealt cards don’t come back',
          body: [
            'In roulette, every spin is independent. In blackjack, the cards that have been dealt are gone until the shuffle. That means the remaining shoe can become **richer in tens and Aces** (good for you) or in small cards (good for the dealer).',
            'Card counting is simply keeping track of which way the shoe has drifted. No memorizing every card, no math genius required.',
          ],
        },
        {
          type: 'text',
          title: 'What it can and can’t do',
          body: [
            'A skilled counter with good rules and deep penetration might turn a ~0.5% house edge into a player edge of about **0.5–1%**. That’s small, and the swings are huge.',
            'Counting **never guarantees winnings.** Counters have losing sessions, losing weeks, sometimes losing months. It shifts the long-run average; it doesn’t remove luck.',
          ],
        },
      ],
    },
    {
      id: 'l7-hilo',
      title: 'Hi-Lo Card Values',
      summary: '+1, 0, −1.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Three groups',
          body: [
            '**2, 3, 4, 5, 6 → +1** (small cards leaving the shoe is good for you).',
            '**7, 8, 9 → 0** (neutral).',
            '**10, J, Q, K, A → −1** (big cards leaving is bad for you).',
            'There are as many +1 cards as −1 cards in a deck, so a full deck counts to exactly zero. It’s a **balanced** count.',
          ],
        },
        { type: 'widget', widget: 'count-drill', title: 'Single cards', body: 'Tap the value of each card as fast as you can.', props: { mode: 'values', count: 20 } },
      ],
    },
    {
      id: 'l7-running',
      title: 'The Running Count',
      summary: 'Keep a running total as cards come out.',
      minutes: 6,
      steps: [
        {
          type: 'text',
          title: 'Add as you go',
          body: [
            'Start at 0 after the shuffle. Add each card’s value as it’s exposed: +1, +1, −1, 0… That total is the **running count**.',
            'Tip: count in pairs. A 5 and a King cancel out (+1 −1 = 0). Pros look at a whole hand and see “cancels” instantly.',
            'The hole card counts when it’s revealed, not before.',
          ],
        },
        { type: 'widget', widget: 'count-drill', title: 'Running count drill', body: 'Cards will flash one at a time. Enter the running count at the end.', props: { mode: 'stream', count: 12 } },
        { type: 'widget', widget: 'count-drill', title: 'Full deck', body: 'Count down an entire deck. The last card is turned over at the end: if your count is right, you’ll know what it is (or at least its group).', props: { mode: 'deck' } },
      ],
    },
    {
      id: 'l7-true',
      title: 'The True Count',
      summary: 'Running count divided by decks remaining.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'Why divide?',
          body: [
            'A running count of +6 means a lot more with one deck left than with five. So counters convert it: **true count = running count ÷ decks remaining.**',
            '+6 with 3 decks left is a true count of +2. +6 with 1.5 decks left is +4.',
            'Most counters round down (toward zero) for betting and playing decisions.',
          ],
        },
        { type: 'widget', widget: 'tc-drill', title: 'Convert it', props: { count: 8 } },
      ],
    },
    {
      id: 'l7-decks',
      title: 'Estimating Decks Remaining',
      summary: 'Read the discard tray.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Look at the tray',
          body: [
            'You don’t count cards remaining one by one. You glance at the **discard tray** and estimate how many decks have been played, to the nearest half deck. Subtract from the total.',
            'In a 6-deck shoe with 2½ decks in the tray, about 3½ decks remain.',
          ],
        },
        { type: 'widget', widget: 'deck-estimation', title: 'Estimate the tray', props: { count: 6 } },
      ],
    },
    {
      id: 'l7-penetration',
      title: 'Penetration & Favorable Shoes',
      summary: 'Why where the cut card goes matters.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Deeper is better',
          body: [
            '**Penetration** is how much of the shoe is dealt before the shuffle. The dealer places a plastic **cut card**; when it comes out, the shoe is shuffled after the hand.',
            'True counts swing more as the shoe runs out, so the big opportunities come late. 75% penetration (4½ of 6 decks dealt) is decent; 65% is poor for counters.',
            'A shoe is **favorable** when the true count is positive enough to overcome the house edge: in a typical 6-deck game, around a true count of +1 or +2.',
          ],
        },
        {
          type: 'quiz',
          q: 'Why do counters prefer deep penetration?',
          options: ['More hands per hour', 'True counts reach higher values late in the shoe', 'The dealer gets tired', 'It’s required by law'],
          answer: 1,
          explain: 'The fewer decks remain, the more a given running count matters.',
        },
      ],
    },
    {
      id: 'l7-betting',
      title: 'Betting with the Count',
      summary: 'Bet more when the shoe favors you.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'The bet spread',
          body: [
            'Counting makes money by **betting more when the true count is high** and the minimum when it isn’t. The ratio of your biggest to smallest bet is your **spread**.',
            'A common rule of thumb: each +1 of true count adds about **0.5%** to the player’s edge. A game with a 0.5% house edge breaks even around a true count of +1.',
            'A simple ramp: 1 unit at true +1 or less, then 2 units per count above that, up to a cap.',
          ],
        },
        {
          type: 'text',
          title: 'This is the only place bet size matters',
          body: [
            'Outside of counting, raising your bet does nothing to your odds. And even counters respect their bankroll: big spreads mean big swings.',
          ],
          tip: 'The app teaches betting with the count as a skill, but never rewards bigger bets with XP.',
        },
        {
          type: 'quiz',
          q: 'True count is +4. Using the simple ramp (1 unit at ≤+1, then 2 per count above), how many units?',
          options: ['1', '4', '6', '8'],
          answer: 2,
          explain: '(4 − 1) × 2 = 6 units.',
        },
      ],
    },
    {
      id: 'l7-deviations',
      title: 'Playing Deviations',
      summary: 'The Illustrious 18, and insurance at +3.',
      minutes: 6,
      steps: [
        {
          type: 'text',
          title: 'When the count changes the play',
          body: [
            'Basic strategy assumes a neutral shoe. When the count is high (lots of tens left), some decisions flip. Each flip has an **index**: the true count at which you deviate.',
            'The most valuable list is Don Schlesinger’s **Illustrious 18** for Hi-Lo. The single most important? **Insurance at true +3 or higher.**',
          ],
        },
        { type: 'widget', widget: 'index-plays', title: 'The Illustrious 18', body: 'Multi-deck, dealer stands on soft 17, Hi-Lo true count.' },
        {
          type: 'quiz',
          q: 'You have 16 against a 10, true count +1. Basic strategy says hit. The index play says…',
          options: ['Hit', 'Stand', 'Double', 'Split'],
          answer: 1,
          explain: '16 vs 10: stand at any true count of 0 or more.',
          cards: '10S 6H',
          dealerUp: 'KD',
        },
      ],
    },
    {
      id: 'l7-mistakes',
      title: 'Common Counting Mistakes',
      summary: 'Where counters go wrong.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'Watch out for',
          body: [
            '**Forgetting the hole card** and dealer hits.',
            '**Not converting to true count**: betting big on +6 at the top of an 8-deck shoe.',
            '**Over-betting the bankroll.** A correct count doesn’t protect you from swings.',
            '**Getting the basic strategy wrong.** Most of a counter’s edge is basic strategy. Mistakes there wipe out the count.',
            '**Counting too slowly** and losing track when the table is fast or chatty.',
            '**Obvious bet jumps** from 1 to 12 units right after a big count. Casinos notice.',
          ],
        },
      ],
    },
    {
      id: 'l7-casino',
      title: 'Countermeasures, Law & Practicalities',
      summary: 'Legal, not welcome, and not a guarantee.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'Is it legal?',
          body: [
            '**Counting cards in your head is legal.** It isn’t cheating; you’re just paying attention.',
            '**Using a device** (an app, a phone, a computer) to count or predict is illegal in casino jurisdictions such as Nevada and New Jersey. Never do it.',
            'Casinos are private businesses, though. In **Nevada** they can ask a counter to stop playing blackjack or to leave. In **New Jersey**, a 1982 state Supreme Court ruling (*Uston v. Resorts International*) bars Atlantic City casinos from excluding counters, so they use countermeasures instead.',
          ],
        },
        {
          type: 'text',
          title: 'Countermeasures',
          body: [
            '**Shuffling early** (poor penetration) or **shuffling when bets jump.**',
            '**Flat-betting** a suspected counter (limiting how much they can raise their bet).',
            '**Continuous shuffling machines**, which make counting useless.',
            '**No mid-shoe entry**, which stops players from jumping in when the count is high.',
          ],
        },
        {
          type: 'text',
          title: 'The practical truth',
          body: [
            'The edge is small and the swings are big. Most people who try counting don’t have the bankroll, the precision or the patience to make it pay. Learn it because it makes you understand the game deeply, not because it’s a way to make money.',
          ],
          tip: 'Counting never guarantees winnings. Set a budget and keep it entertainment.',
        },
      ],
    },
  ],
}
