import type { Level } from './types'

export const LEVEL_1: Level = {
  n: 1,
  title: 'Blackjack Fundamentals',
  tagline: 'Card values, totals, and how a hand is won.',
  lessons: [
    {
      id: 'l1-welcome',
      title: 'Welcome to the Table',
      summary: 'What you’re trying to do, and who you’re playing against.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'Pull up a chair',
          body: [
            'Welcome. I’ll be your dealer, and I’ll be on your side the whole way.',
            'Blackjack has one goal: **beat the dealer’s hand without going over 21.** That’s it. You don’t play against the other people at the table. Everyone at the table plays against the dealer.',
            'You can win three ways: finish with a higher total than the dealer, have the dealer go over 21 (a **bust**) while you’re still in, or get a **blackjack** (an Ace and a ten-value card as your first two cards).',
          ],
          cards: 'AS KH',
          tip: 'Getting close to 21 isn’t the goal. Beating the dealer is. A 13 that beats a dealer bust wins the same as a 20.',
        },
        {
          type: 'text',
          title: 'Why the house has the edge',
          body: [
            'Here’s the catch: **you act first.** If you go over 21, you lose immediately, even if the dealer busts afterward.',
            'That one rule is where the casino’s advantage comes from. Everything you learn here (strategy, doubling, splitting) is about cutting that advantage as small as it can go.',
          ],
        },
        {
          type: 'quiz',
          q: 'Who are you playing against at a blackjack table?',
          options: ['The other players', 'The dealer', 'Whoever has the highest hand', 'The casino’s computer'],
          answer: 1,
          explain: 'Every player plays their own hand against the dealer. Other players’ decisions don’t change the math of your hand over time.',
        },
        {
          type: 'quiz',
          q: 'You bust with 23. Then the dealer busts with 24. What happens to your bet?',
          options: ['It pushes', 'You win', 'You lose', 'You get half back'],
          answer: 2,
          explain: 'You bust first, so you lose right away. Your cards and chips are taken before the dealer even plays. That’s the house edge in a nutshell.',
        },
      ],
    },
    {
      id: 'l1-values',
      title: 'Card Values',
      summary: 'Number cards, face cards, and the flexible Ace.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'Three simple rules',
          body: [
            '**Number cards (2–10)** are worth their number.',
            '**Face cards (Jack, Queen, King)** are each worth 10. So is the 10 itself. Dealers call all of these “tens” or “ten-value cards.”',
            '**The Ace** is worth 1 *or* 11, whichever helps your hand more.',
            'Suits don’t matter at all in blackjack. A King of hearts and a 10 of clubs are exactly the same card.',
          ],
          cards: 'JH QS KD 10C',
        },
        { type: 'widget', widget: 'card-values', title: 'Tap a card', body: 'Tap any card to see what it’s worth.' },
        {
          type: 'text',
          title: 'Ten-value cards are everywhere',
          body: ['Four of the thirteen ranks (10, J, Q, K) count as 10. That makes ten-value cards the most common value in the deck, about **31%** of all cards. Keep that in mind; a lot of strategy is built on it.'],
        },
        {
          type: 'quiz',
          q: 'What is a Queen worth?',
          options: ['12', '10', '11', '1'],
          answer: 1,
          explain: 'All face cards are worth 10.',
          cards: 'QH',
        },
        {
          type: 'quiz',
          q: 'What fraction of the deck is worth 10?',
          options: ['1 in 13', '2 in 13', '4 in 13', 'Half'],
          answer: 2,
          explain: '10, Jack, Queen and King: four ranks out of thirteen.',
        },
      ],
    },
    {
      id: 'l1-totals',
      title: 'Hand Totals: Hard and Soft',
      summary: 'Add up a hand, and learn what “soft” means.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'Adding it up',
          body: [
            'Your total is just the sum of your cards. A 9 and a 7 is 16.',
            'When there’s an Ace, count it as 11 if that doesn’t take you over 21. An Ace and a 6 is **17**, because 11 + 6 = 17.',
          ],
          cards: 'AS 6H',
        },
        {
          type: 'text',
          title: 'Soft hands',
          body: [
            'A hand where an Ace is counted as 11 is a **soft** hand. Ace-6 is “soft 17.”',
            'Soft hands are flexible. If you take another card and it would put you over 21, the Ace simply drops to 1. **A soft hand can’t bust on the next card.**',
            'Draw a 9 to that soft 17 and you have Ace + 6 + 9 = 16, with the Ace counting as 1. That’s now a **hard 16**.',
          ],
          cards: 'AS 6H 9D',
        },
        {
          type: 'text',
          title: 'Hard hands',
          body: ['A **hard** hand has no Ace, or has Aces that must count as 1. Hard hands can bust. A 10 and a 6 is hard 16. One more card of 6 or higher and you’re over.'],
          cards: '10C 6S',
        },
        { type: 'widget', widget: 'hand-builder', title: 'Build a hand', body: 'Tap cards to add them. Watch the total and whether it’s soft or hard.' },
        { type: 'widget', widget: 'total-quiz', title: 'Quick check', body: 'Name the total of each hand.', props: { count: 6 } },
        {
          type: 'quiz',
          q: 'Ace, Ace, 9: what is the total?',
          options: ['Hard 11', 'Soft 21', 'Bust', 'Soft 11'],
          answer: 1,
          explain: 'One Ace counts as 11, the other as 1: 11 + 1 + 9 = 21. It’s soft because an Ace is still counted as 11.',
          cards: 'AS AH 9D',
        },
      ],
    },
    {
      id: 'l1-outcomes',
      title: 'Blackjack, Busts and Pushes',
      summary: 'Every way a hand can end, and how each pays.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Blackjack (a “natural”)',
          body: [
            'An Ace plus any ten-value card **as your first two cards** is a blackjack. It beats every other hand, including a 21 made with three or more cards.',
            'A blackjack traditionally pays **3 to 2**: bet $10, win $15. Some tables pay only 6 to 5 ($12 on a $10 bet). That costs you a lot over time; we’ll show you exactly how much later.',
          ],
          cards: 'AD JS',
        },
        {
          type: 'text',
          title: '21 is not always blackjack',
          body: [
            'Three cards that total 21 (say 7-7-7) are just “21.” They win even money, and they lose to a dealer blackjack.',
            'Same if you split Aces and catch a ten: that’s 21, not a blackjack, and pays 1 to 1.',
          ],
          cards: '7S 7H 7D',
        },
        {
          type: 'text',
          title: 'Bust, win, lose, push',
          body: [
            '**Bust:** your total goes over 21. You lose immediately.',
            '**Win:** you beat the dealer’s total, or the dealer busts. Paid 1 to 1 (even money).',
            '**Lose:** the dealer finishes higher than you.',
            '**Push:** a tie. You keep your bet; nobody wins. Two blackjacks also push.',
          ],
        },
        {
          type: 'quiz',
          q: 'You have 7-7-7 (21). The dealer has Ace-King. What happens?',
          options: ['Push', 'You win', 'You lose', 'You win 3:2'],
          answer: 2,
          explain: 'The dealer has blackjack, and blackjack beats any multi-card 21.',
          cards: '7S 7H 7D',
        },
        {
          type: 'quiz',
          q: 'You bet $20 and get a blackjack at a 3:2 table. How much do you win?',
          options: ['$20', '$24', '$30', '$40'],
          answer: 2,
          explain: '3 to 2 means $3 for every $2 bet: $20 × 1.5 = $30. You keep your $20 too.',
        },
        {
          type: 'quiz',
          q: 'You have 19 and the dealer has 19. What happens?',
          options: ['The dealer wins ties', 'Push: you keep your bet', 'You win', 'The hand is redealt'],
          answer: 1,
          explain: 'Ties are pushes. The dealer does not win ties in blackjack.',
        },
      ],
    },
    {
      id: 'l1-dealer',
      title: 'The Dealer’s Rules',
      summary: 'The dealer has no choices. Learn the rules they must follow.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'The dealer is a robot (a friendly one)',
          body: [
            'You get to make decisions. The dealer doesn’t. They follow fixed house rules, every hand:',
            '**Below 17, the dealer must hit.** **On 17 or more, the dealer must stand.**',
            'The dealer can’t double, split, or surrender, and doesn’t care what you’re holding. A dealer with 16 hits even if every player at the table has 13.',
          ],
        },
        {
          type: 'text',
          title: 'Soft 17: the one wrinkle',
          body: [
            'Tables differ on one thing: what the dealer does with a **soft 17** (an Ace counted as 11 plus a 6).',
            '**S17:** “Dealer stands on all 17s.” Better for you.',
            '**H17:** “Dealer hits soft 17.” This gives the dealer a chance to improve, and it costs players about 0.2% in house edge.',
            'It’s printed on the felt. Look for “Dealer must stand on all 17s” or “Dealer must hit soft 17.”',
          ],
          cards: 'AS 6D',
        },
        { type: 'widget', widget: 'dealer-play', title: 'Watch the dealer play', body: 'Flip between S17 and H17 and watch the same cards play out differently.' },
        {
          type: 'quiz',
          q: 'The dealer has 10-6. Every player at the table has stood on 12. What does the dealer do?',
          options: ['Stands, they’ve already won', 'Hits, they must hit below 17', 'Can choose', 'Surrenders'],
          answer: 1,
          explain: 'The dealer has no choices. 16 is below 17, so they hit, even though it risks a bust.',
        },
        {
          type: 'quiz',
          q: 'At an H17 table, the dealer has Ace-6. What happens?',
          options: ['Stands on 17', 'Hits', 'Has blackjack', 'Re-shuffles'],
          answer: 1,
          explain: 'Ace-6 is soft 17. Under H17 the dealer hits it.',
          cards: 'AS 6D',
        },
      ],
    },
    {
      id: 'l1-flow',
      title: 'How a Round Plays Out',
      summary: 'From placing a bet to getting paid, in order.',
      minutes: 4,
      steps: [
        {
          type: 'widget',
          widget: 'round-flow',
          title: 'The order of a round',
          body: 'Every round follows the same sequence. Step through it.',
        },
        {
          type: 'text',
          title: 'Upcard and hole card',
          body: [
            'The dealer gets one card face up (the **upcard**) and one face down (the **hole card**). Your decisions are based on the upcard, since that’s all you can see.',
            'If the upcard is an Ace or a ten, the dealer checks (“peeks”) for blackjack before anyone plays. If they have it, the hand ends right there.',
          ],
        },
        {
          type: 'quiz',
          q: 'Who acts first after the cards are dealt?',
          options: ['The dealer', 'The player on the dealer’s left (first base)', 'The player on the dealer’s right', 'Whoever bet the most'],
          answer: 1,
          explain: 'Play goes from the dealer’s left (first base) around to the dealer’s right (third base). The dealer always goes last.',
        },
      ],
    },
  ],
}

export const LEVEL_2: Level = {
  n: 2,
  title: 'Casino Etiquette & Hand Signals',
  tagline: 'Sit down at a real table and know exactly what to do.',
  lessons: [
    {
      id: 'l2-table',
      title: 'Finding Your Table',
      summary: 'Read the table sign and the felt before you sit.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Read the sign first',
          body: [
            'Every table has a small sign (the **placard**) at the dealer’s side. It tells you the **minimum and maximum bet**: “$25 – $1,000” means each bet must be at least $25.',
            'Check it before you sit. Sitting at a table you can’t afford and asking the dealer to make an exception is the classic rookie move.',
            'The sign or felt also lists the rules: how many decks, **3:2 or 6:5** blackjack payout, and whether the dealer hits soft 17.',
          ],
          tip: 'If the felt says “Blackjack pays 6 to 5,” walk to another table. You’ll learn why in Level 6.',
        },
        { type: 'widget', widget: 'table-layout', title: 'Know the layout', body: 'Tap each part of the table.' },
        {
          type: 'text',
          title: 'Choosing a seat',
          body: [
            'Any open seat with no chips or cards in front of it is fair game. Some tables have a “No mid-shoe entry” sign: wait for the shuffle before joining.',
            '**First base** (dealer’s left) acts first. **Third base** (dealer’s right) acts last. Seat choice doesn’t change your odds, despite what the guy at third base may tell you.',
          ],
        },
        {
          type: 'quiz',
          q: 'The placard says “$15 – $500.” What’s the smallest bet you can make?',
          options: ['$1', '$5', '$15', '$500'],
          answer: 2,
          explain: 'The first number is the table minimum.',
        },
      ],
    },
    {
      id: 'l2-buyin',
      title: 'Buying Chips',
      summary: 'How to buy in without handing anything to the dealer.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Wait, then lay it down',
          body: [
            'Wait until the current hand is over. Then **lay your cash flat on the felt** in front of you, outside the betting circle, and say “Change, please.”',
            '**Never hand money directly to the dealer.** Dealers aren’t allowed to take anything from your hand. Everything happens on the table, where the cameras (the “eye in the sky”) can see it.',
            'The dealer spreads your cash out, counts it for the camera, calls it out to the pit boss, and pushes your chips to you.',
          ],
          tip: 'Don’t put cash inside the betting circle. In some casinos that means you’re betting the cash on this hand.',
        },
        { type: 'widget', widget: 'chip-colors', title: 'Chip colors', body: 'Colors vary by casino, but most follow this pattern.' },
        {
          type: 'text',
          title: 'Coloring up when you leave',
          body: ['When you’re done, push your chips to the dealer between hands and say “Color up, please.” They’ll swap them for fewer, larger chips that are easier to carry to the cashier (the “cage”).'],
        },
        {
          type: 'quiz',
          q: 'You want $200 in chips. What do you do?',
          options: ['Hand the bills to the dealer', 'Put the bills in the betting circle', 'Lay the bills on the felt between hands and say “Change, please”', 'Wave to the pit boss'],
          answer: 2,
          explain: 'Cash goes on the felt, between hands, never into the dealer’s hand.',
        },
        {
          type: 'quiz',
          q: 'A green chip is usually worth…',
          options: ['$1', '$5', '$25', '$100'],
          answer: 2,
          explain: 'Green is the common color for $25. Red is $5 and black is $100.',
        },
      ],
    },
    {
      id: 'l2-betting',
      title: 'Placing Your Bet',
      summary: 'Where chips go, and when not to touch them.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'Inside the circle',
          body: [
            'Place your bet **inside the betting circle** (or box) in front of your seat, before the dealer starts dealing.',
            'If you bet with several chips, stack them with the **largest value on the bottom**. It lets the dealer and the cameras read your bet at a glance.',
          ],
        },
        {
          type: 'text',
          title: 'Hands off once the cards come out',
          body: [
            'Once the first card is dealt, **don’t touch your bet** until the hand is paid. Adding or removing chips after cards are out looks like cheating (“past-posting”), even if you meant nothing by it.',
            'The only time you add chips mid-hand is to double down or split, and those go **beside** your bet, not on top of it.',
            'When you win, the dealer puts your winnings next to your bet. Pick both up (or leave them to bet again) after the dealer has finished paying the table.',
          ],
        },
        {
          type: 'quiz',
          q: 'Cards are out and you decide you bet too much. What can you do?',
          options: ['Take a chip back quickly', 'Ask the dealer to change it', 'Nothing: the bet stands for this hand', 'Move it to the insurance line'],
          answer: 2,
          explain: 'Once cards are dealt, your bet is locked in. Change it before the next hand.',
        },
      ],
    },
    {
      id: 'l2-signals',
      title: 'Hand Signals: Face-Up Games',
      summary: 'Hit, stand, double, split and surrender without saying a word.',
      minutes: 6,
      steps: [
        {
          type: 'text',
          title: 'Why signals?',
          body: [
            'In a casino, the dealer will often ask you to **use hand signals**, even if you also say what you want. The cameras record every hand, and a clear signal settles any dispute about what you asked for.',
            'Most Atlantic City shoe games deal player cards **face up**. In those games you **never touch your cards**. You signal instead.',
          ],
        },
        { type: 'widget', widget: 'signals-demo', title: 'The five signals', body: 'Tap each one to see how it’s done.', props: { style: 'face-up' } },
        {
          type: 'text',
          title: 'Doubling and splitting',
          body: [
            '**Double down:** place a second bet, equal to your first, **next to** your original bet (not on top). Then hold up one finger, meaning “one card.”',
            '**Split:** place a second equal bet next to your original and make a V with two fingers. The dealer separates your cards into two hands.',
            'You can “double for less” (add less than your full bet), but it’s almost always a mistake. If it’s right to double, double the full amount.',
          ],
        },
        {
          type: 'text',
          title: 'Surrender',
          body: [
            'Surrender has no universal signal. **Say “Surrender”** clearly. Many dealers also accept drawing a line with your finger across the felt behind your bet.',
            'You must surrender before taking any other action, and only on your first two cards.',
          ],
        },
        { type: 'widget', widget: 'signal-drill', title: 'Your turn', body: 'The dealer turns to you. Show them the right signal.', props: { style: 'face-up', count: 6 } },
      ],
    },
    {
      id: 'l2-pitch',
      title: 'Face-Down (Pitch) Games',
      summary: 'Single- and double-deck games where you hold your cards.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'A different set of manners',
          body: [
            'Single- and double-deck games are often **pitched** from the dealer’s hand, face down. Here you *do* pick up your cards, but with these rules:',
            '**One hand only.** Hold your cards with one hand, keep them over the table, and never take them off the table or out of sight.',
          ],
        },
        { type: 'widget', widget: 'signals-demo', title: 'Face-down signals', body: 'Same decisions, different motions.', props: { style: 'face-down' } },
        {
          type: 'text',
          title: 'Busts, blackjacks, doubles, splits',
          body: [
            '**Bust?** Toss your cards face up on the table right away. The dealer takes your bet.',
            '**Blackjack?** Turn your cards face up immediately so the dealer can pay you.',
            '**Doubling or splitting?** Turn your cards face up on the felt, then put your extra bet beside the original.',
          ],
        },
        { type: 'widget', widget: 'signal-drill', title: 'Practice: pitch game', body: 'You’re holding your cards. What do you do?', props: { style: 'face-down', count: 5 } },
      ],
    },
    {
      id: 'l2-dealer',
      title: 'Dealer Procedures & Your Turn',
      summary: 'What the dealer is doing, when to act, and when to wait.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'Reading the dealer',
          body: [
            '“**Place your bets.**” Get your chips in the circle.',
            '“**No more bets.**” Hands off. The dealer is about to deal.',
            '“**Insurance?**” or “**Insurance is open.**” The dealer has an Ace up. You may place an insurance bet on the insurance line, or just do nothing to decline. (You’ll learn why doing nothing is usually right.)',
            'The dealer then checks the hole card. If there’s no blackjack, play begins at first base.',
          ],
        },
        {
          type: 'text',
          title: 'When it’s your turn',
          body: [
            'The dealer will look at you, point to your hand, and often say your total: “Sixteen.” That’s your cue. Signal clearly and keep your hands still otherwise.',
            '**Before your turn,** wait. Don’t signal early, don’t comment on other players’ hands, and don’t tell anyone how to play unless they ask.',
            'After the last player, the dealer flips the hole card, draws by the house rules, and pays or collects every hand from third base back to first.',
          ],
        },
        {
          type: 'text',
          title: 'Tipping (“toking”)',
          body: [
            'Tipping isn’t required, but it’s common when you’re treated well. The friendliest way: place a small bet for the dealer **in front of your betting circle** (outside it). If your hand wins, the dealer’s bet wins too.',
            'Or simply hand a chip across the table as a tip between hands, and say so.',
          ],
        },
        {
          type: 'quiz',
          q: 'It’s the player at first base’s turn. You already know you’ll stand. What do you do?',
          options: ['Wave now so the dealer knows', 'Wait for your turn', 'Tell the first-base player what to do', 'Tuck your cards'],
          answer: 1,
          explain: 'Wait until the dealer comes to you. Acting out of turn causes confusion and mistakes.',
        },
      ],
    },
    {
      id: 'l2-mistakes',
      title: 'Common Rookie Mistakes',
      summary: 'The quick list of things that mark you as new.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'Avoid these',
          body: [
            '**Touching your cards** in a face-up shoe game.',
            '**Handing cash or chips** directly to the dealer.',
            '**Touching your bet** after the cards are dealt.',
            '**Signalling unclearly** or only saying it out loud.',
            '**Blaming other players.** “Third base took the dealer’s bust card!” Over time, other players’ decisions don’t help or hurt you.',
            '**Giving unsolicited advice.** Let people play their own hands.',
            '**Phones and cameras** at the table. Most casinos don’t allow them during play.',
            '**Chasing losses** by raising your bets to win it back. That’s how a bad night becomes a disaster.',
          ],
        },
        {
          type: 'quiz',
          q: 'The player at third base hits and the dealer makes 21. Did that player cost you money?',
          options: ['Yes, they took the bust card', 'Not in the long run: it helps you as often as it hurts', 'Only if they’re a beginner', 'Yes, always'],
          answer: 1,
          explain: 'The next card is unknown to everyone. A player hitting is just as likely to take a card that helps the dealer as one that would have hurt them. It evens out.',
        },
      ],
    },
    {
      id: 'l2-online',
      title: 'Online vs. In Person',
      summary: 'Buttons instead of gestures, and what changes.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Digital tables',
          body: [
            'Online blackjack (on apps like FanDuel and other regulated sites) uses **buttons** for every decision: Hit, Stand, Double, Split, and sometimes Surrender. No signals, no etiquette worries.',
            'Insurance appears as a **pop-up**: “Insurance? Yes / No.” Even money shows up the same way when you have blackjack.',
            'Most games have a **decision timer**. If it runs out, many games stand for you automatically. Know what your game does.',
          ],
        },
        {
          type: 'text',
          title: 'What’s different',
          body: [
            '**Speed:** digital games can deal several times faster than a live table. Faster play means the house edge works on more of your money per hour.',
            '**Shuffling:** RNG games effectively shuffle every hand, so card counting doesn’t work. Live-dealer streams use real shoes, but are typically shuffled early.',
            '**Rules vary:** check the game’s help screen for decks, H17/S17, payout, and surrender. The same strategy chart principles apply.',
            '**Tools:** regulated sites offer deposit limits, time reminders and self-exclusion. Use them.',
          ],
          tip: 'This app uses training chips only. There’s no real money here, ever.',
        },
        {
          type: 'quiz',
          q: 'Why doesn’t card counting work on most online blackjack?',
          options: ['It’s illegal online', 'The deck is effectively reshuffled every hand', 'The cards are hidden', 'The dealer is a computer'],
          answer: 1,
          explain: 'Counting needs the shoe to run deep without a shuffle. A fresh shuffle every hand resets everything.',
        },
      ],
    },
  ],
}

export const LEVEL_3: Level = {
  n: 3,
  title: 'Player Decisions',
  tagline: 'Hit, stand, double, split, surrender, insurance: what each does and when.',
  lessons: [
    {
      id: 'l3-hit',
      title: 'Hitting',
      summary: 'Taking another card: the risk and the reward.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'What hitting does',
          body: [
            'Hitting adds one card to your hand. You can hit as many times as you like until you stand, reach 21, or bust.',
            'Financially, nothing changes: your bet stays the same. You’re trading the risk of busting for the chance of a better total.',
          ],
        },
        { type: 'widget', widget: 'player-bust', title: 'How risky is a hit?', body: 'The chance one more card busts a hard total.' },
        {
          type: 'text',
          title: 'When to hit',
          body: [
            '**Always hit hard 11 or less** (unless you double). You can’t bust.',
            '**Hit hard 12–16 when the dealer shows 7 or higher.** The dealer will usually finish with 17+, so standing on 16 mostly loses.',
            '**Hit soft hands up to soft 17**, and soft 18 against a dealer 9, 10, or Ace (when you can’t double).',
          ],
        },
        { type: 'decision', cards: '10S 4H', dealerUp: '9D', prompt: 'Hard 14 against a 9. Your call.' },
        { type: 'decision', cards: '5S 3H', dealerUp: '6D', prompt: 'Hard 8 against a 6.' },
      ],
    },
    {
      id: 'l3-stand',
      title: 'Standing',
      summary: 'Keeping what you have and letting the dealer take the risk.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'What standing does',
          body: [
            'Standing ends your turn. Your total is locked in, and the dealer plays.',
            'Stand when your hand is strong (hard 17+), or when the dealer is likely to bust and you’d risk busting first if you hit.',
          ],
        },
        { type: 'widget', widget: 'bust-table', title: 'The dealer’s bust zone', body: 'How often the dealer busts from each upcard, computed for this table’s rules.' },
        {
          type: 'text',
          title: 'Letting the dealer bust',
          body: [
            'With a **2 through 6** showing, the dealer is in trouble. They must draw to 17 and bust far more often. Stand on hard 12–16 against 4, 5, and 6 (and 13–16 against 2 and 3).',
            'This is the most common beginner mistake in reverse: people hit 13 against a 6 because 13 “feels low.” You don’t need a big total if the dealer busts.',
          ],
        },
        { type: 'decision', cards: '10S 3H', dealerUp: '5D', prompt: 'Hard 13 against a dealer 5.' },
        { type: 'decision', cards: '10S 2H', dealerUp: '3D', prompt: 'Hard 12 against a 3. Careful.' },
      ],
    },
    {
      id: 'l3-double',
      title: 'Doubling Down',
      summary: 'Double your bet for exactly one more card.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: 'What doubling does',
          body: [
            'Doubling down **doubles your bet** and gives you **exactly one more card**. Then your hand is finished.',
            'Bet $25, double, and you now have $50 riding on one card. Win and you’re paid $50. Lose and you lose $50.',
            'Most tables let you double on any first two cards. Some only allow it on 9, 10, or 11. You can never double after hitting.',
          ],
        },
        {
          type: 'text',
          title: 'When to double',
          body: [
            'Double when you’re **the favorite** and want more money out: usually **11** against anything but an Ace, **10** against 2–9, and **9** against 3–6.',
            'You also double some **soft hands** against weak dealer cards: Ace-2 through Ace-7 against 5 and 6, for example. A soft hand can’t bust on that one card.',
          ],
          tip: 'Doubling is where good players make back much of the house edge. Skipping good doubles is a quiet, expensive mistake.',
        },
        { type: 'widget', widget: 'ev-compare', title: 'Why it pays', body: 'Compare the value of hitting and doubling 11 against a 6.', props: { cards: '6S 5H', up: '6D' } },
        { type: 'decision', cards: '6S 5H', dealerUp: '10D', prompt: 'Hard 11 against a 10.' },
        { type: 'decision', cards: 'AS 6H', dealerUp: '4D', prompt: 'Soft 17 against a 4.' },
        { type: 'decision', cards: '5S 4H', dealerUp: '2D', prompt: 'Hard 9 against a 2.' },
      ],
    },
    {
      id: 'l3-split',
      title: 'Splitting Pairs',
      summary: 'Turn a pair into two hands, with a bet on each.',
      minutes: 6,
      steps: [
        {
          type: 'text',
          title: 'What splitting does',
          body: [
            'When your first two cards are a pair, you can **split** them into two separate hands. You put out a **second bet equal to the first**, and each hand gets its own second card.',
            'You play the first hand to completion, then the second. Each wins or loses on its own.',
            'Many tables let you split again (**resplit**) if you get another pair, up to 3 or 4 hands. Most allow you to **double after splitting** (DAS).',
          ],
          cards: '8S 8H',
        },
        {
          type: 'text',
          title: 'Split Aces are special',
          body: [
            'When you split Aces, each Ace usually gets **only one card**. You can’t hit again.',
            'An Ace plus a ten after a split is **21, not blackjack**, and pays even money.',
            'Even so, **always split Aces.** Starting two hands with an 11 is far better than playing a soft 12.',
          ],
          cards: 'AS AD',
        },
        {
          type: 'text',
          title: 'The rules everyone remembers',
          body: [
            '**Always split Aces and 8s.** 8-8 is a 16, the worst total in the game. Two hands starting with 8 lose less, even against a 10.',
            '**Never split 10s or 5s.** 10-10 is a 20. 5-5 is a 10, a great double.',
            'Everything else (2s, 3s, 4s, 6s, 7s, 9s) depends on the dealer’s upcard. The strategy chart covers it.',
          ],
        },
        { type: 'decision', cards: '8S 8H', dealerUp: '10D', prompt: 'Pair of 8s against a 10.' },
        { type: 'decision', cards: 'KS QH', dealerUp: '6D', prompt: 'Two tens against a 6. Tempting?' },
        { type: 'decision', cards: '9S 9H', dealerUp: '7D', prompt: 'Pair of 9s against a 7.' },
      ],
    },
    {
      id: 'l3-surrender',
      title: 'Surrender',
      summary: 'Give up half your bet to get out of a terrible hand.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'What surrender does',
          body: [
            'Surrender lets you **give up your hand and get half your bet back**. Bet $20, surrender, and you lose $10 instead of risking $20.',
            'Most US casinos that offer it use **late surrender**: the dealer first checks for blackjack. If they have it, you lose the whole bet; surrender is only available once they’ve confirmed they don’t.',
            'You can only surrender your **first two cards**, before any other action, and never after splitting.',
          ],
        },
        {
          type: 'text',
          title: 'When to surrender',
          body: [
            'Surrender when a hand **loses more than half the time** no matter how you play it. On a typical 6-deck game where the dealer stands on soft 17: surrender **hard 16 against 9, 10, or Ace**, and **hard 15 against 10**.',
            'If the dealer hits soft 17, add 15 and 17 against an Ace, and 8-8 against an Ace.',
            'Don’t surrender just because a hand looks bad. Surrender is a precise tool, not a panic button.',
          ],
        },
        { type: 'decision', cards: '10S 6H', dealerUp: 'KD', prompt: 'Hard 16 against a King, surrender available.', rules: { lateSurrender: true } },
        { type: 'decision', cards: '10S 5H', dealerUp: '9D', prompt: 'Hard 15 against a 9.', rules: { lateSurrender: true } },
      ],
    },
    {
      id: 'l3-insurance',
      title: 'Insurance & Even Money',
      summary: 'The side bet offered when the dealer shows an Ace.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'What insurance is',
          body: [
            'When the dealer shows an **Ace**, you’ll be offered **insurance**. It’s a separate bet, up to **half your original bet**, that the dealer’s hole card is a ten (meaning they have blackjack).',
            'If the dealer has blackjack, insurance pays **2 to 1**. Your main bet loses, but the insurance win covers it.',
            'If the dealer doesn’t have blackjack, you lose the insurance bet and the hand continues normally.',
          ],
        },
        {
          type: 'text',
          title: 'Even money',
          body: [
            'If *you* have blackjack and the dealer shows an Ace, the dealer will ask “**Even money?**” Taking it pays your blackjack 1 to 1 right now, guaranteed. It’s exactly the same as insuring your blackjack.',
            'Basic strategy says **decline insurance**, every time. Level 4 shows you the math (and the one 6:5 exception for even money).',
          ],
        },
        { type: 'widget', widget: 'payout-calc', title: 'Follow the money', body: 'See how insurance settles in both cases.' },
        {
          type: 'quiz',
          q: 'You bet $20 and take $10 insurance. The dealer has blackjack. What’s your total result?',
          options: ['Lose $30', 'Lose $20', 'Break even', 'Win $20'],
          answer: 2,
          explain: 'Your $20 bet loses, but the $10 insurance pays 2:1 ($20). Net: zero.',
        },
      ],
    },
  ],
}

export const LEVEL_4: Level = {
  n: 4,
  title: 'Insurance & Side Bets',
  tagline: 'What these bets actually cost, computed for real shoes.',
  lessons: [
    {
      id: 'l4-protects',
      title: 'What Insurance Really Protects',
      summary: 'Spoiler: not your hand.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'It’s a bet, not a policy',
          body: [
            'The name is clever marketing. Insurance doesn’t protect your hand. It’s a **separate side bet** on one question: *is the hole card a ten?*',
            'Whether you have 20 or 12 doesn’t change the answer. Insuring a “good hand” is still the same bet on the same card.',
          ],
        },
        {
          type: 'quiz',
          q: 'You have 20. The dealer shows an Ace. Is insurance a better bet now than if you had 12?',
          options: ['Yes, you have more to protect', 'No, it’s the same bet on the same hole card', 'Yes, because 20 usually wins', 'Only at 6:5 tables'],
          answer: 1,
          explain: 'Insurance only cares whether the hole card is a ten. (Technically your two ten-value cards make the hole card slightly *less* likely to be a ten.)',
        },
      ],
    },
    {
      id: 'l4-math',
      title: 'The Insurance Math',
      summary: 'Why the mathematics usually says no.',
      minutes: 5,
      steps: [
        {
          type: 'text',
          title: '2 to 1 isn’t enough',
          body: [
            'With a fresh shoe, 4 of every 13 cards are tens. So insurance wins about 4 times in 13 and loses 9 times in 13.',
            'Bet $1 thirteen times: win $2 four times (+$8), lose $1 nine times (−$9). Net: **−$1 every 13 bets, about −7.7%.** That’s a worse bet than the blackjack hand itself.',
          ],
        },
        { type: 'widget', widget: 'insurance-math', title: 'Change the shoe', body: 'Insurance only becomes a good bet when tens are unusually plentiful. Slide to see where that happens.' },
        {
          type: 'text',
          title: 'The counter’s exception',
          body: ['Card counters track exactly that. In Hi-Lo, insurance becomes profitable at a **true count of about +3** or higher. Without a count, always decline.'],
        },
        {
          type: 'quiz',
          q: 'Roughly what does insurance cost per bet, off the top of a shoe?',
          options: ['Nothing, it’s fair', 'About 1%', 'About 7.7%', 'About 30%'],
          answer: 2,
          explain: '2 × (4/13) − (9/13) = −1/13 ≈ −7.7%.',
        },
      ],
    },
    {
      id: 'l4-even-money',
      title: 'Even Money',
      summary: 'A guaranteed win sounds great. Here’s the real comparison.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'Guaranteed vs. expected',
          body: [
            'You have blackjack; the dealer shows an Ace. **Even money** pays you 1 to 1 now. Declining means you’ll get paid 3 to 2 unless the dealer also has blackjack (then it’s a push).',
            'The dealer has blackjack about 4 times in 13. So declining pays 1.5 bets about 9 times in 13: an average of **about 1.04 bets**, versus exactly **1.00** for even money. Declining is worth more.',
            'The difference is small on any one hand, but it’s real, and good players take the better side every time.',
          ],
        },
        {
          type: 'text',
          title: 'The 6:5 exception',
          body: [
            'At a 6:5 table, declining pays 1.2 bets about 9 times in 13: an average of about **0.83 bets**. Now even money (1.00) is better!',
            'The real lesson: don’t play 6:5 tables. But if you’re there, the app’s teaching dealer will tell you to take even money.',
          ],
        },
        {
          type: 'quiz',
          q: 'At a standard 3:2 table, should you take even money on your blackjack?',
          options: ['Yes, always take a sure thing', 'No, declining is worth more on average', 'Only against a King', 'Only if you bet big'],
          answer: 1,
          explain: 'About 1.04 bets on average for declining vs. 1.00 for even money.',
        },
      ],
    },
    {
      id: 'l4-perfect-pairs',
      title: 'Perfect Pairs',
      summary: 'A side bet on your first two cards being a pair.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'How it works',
          body: [
            'Perfect Pairs is an optional side bet placed before the deal. It pays if your first two cards are a pair: more for a same-suit pair, less for a mixed pair.',
            'A common paytable is **25 to 1** (perfect: same suit), **12 to 1** (colored: same color), **6 to 1** (mixed). Big payouts, which is exactly what makes them fun and expensive.',
          ],
        },
        { type: 'widget', widget: 'perfect-pairs', title: 'The exact math', body: 'Computed for each shoe size by counting the actual card combinations.' },
        {
          type: 'quiz',
          q: 'Compared to the main blackjack bet played with basic strategy, Perfect Pairs is…',
          options: ['Better for the player', 'About the same', 'Much more expensive', 'Free'],
          answer: 2,
          explain: 'A basic strategy hand costs well under 1% on good rules. Perfect Pairs costs several percent per bet.',
        },
      ],
    },
    {
      id: 'l4-21p3',
      title: '21+3',
      summary: 'Your two cards plus the dealer’s upcard as a poker hand.',
      minutes: 4,
      steps: [
        {
          type: 'text',
          title: 'How it works',
          body: [
            '21+3 makes a three-card poker hand from **your first two cards and the dealer’s upcard**. Flushes, straights, three of a kind and straight flushes pay.',
            'Older “classic” tables pay 9 to 1 on any winner. Many modern tables pay more for rarer hands: up to 100 to 1 for suited trips.',
          ],
        },
        { type: 'widget', widget: 'twenty-one-plus-three', title: 'The exact math', body: 'Every three-card combination counted for the shoe size you pick.' },
      ],
    },
    {
      id: 'l4-house-edge',
      title: 'Side Bets: Expensive Entertainment',
      summary: 'How to think about every flashy side bet you’ll see.',
      minutes: 3,
      steps: [
        {
          type: 'text',
          title: 'The pattern',
          body: [
            'Casinos invent side bets because they’re profitable. Lucky Ladies, Buster Blackjack, Royal Match, Bust It, Match the Dealer: the names change, but the math rhymes: big payouts on rare events, and a house edge **several times higher** than the main game.',
            'Think of a side bet as the price of a little extra excitement. If you play one, keep it small, and know that it isn’t a strategy.',
            'The main game, played well, is one of the cheapest bets in the casino. Side bets give that advantage right back.',
          ],
          tip: 'This app never rewards you for side bets or bigger wagers. XP comes only from good decisions and learning.',
        },
        {
          type: 'quiz',
          q: 'What’s the best general rule for side bets?',
          options: ['Always play them on hot tables', 'Play them when you’re losing to catch up', 'Treat them as costly entertainment, if at all', 'They’re how pros win'],
          answer: 2,
          explain: 'They carry much higher house edges than basic strategy blackjack.',
        },
      ],
    },
  ],
}
