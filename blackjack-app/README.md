# Blackjack: The Table

*Learn the game. Master the strategy. Own the table.*

A blackjack academy and casino simulator in one app. A beginner with zero knowledge works through seven levels, practices every decision, learns real-table etiquette and hand signals, and plays a live table while a teaching dealer explains every hand. **Training chips only. There is no real-money gambling, deposits, or wagering.**

Live (after this branch is deployed to GitHub Pages): `https://codeytynan29.github.io/sparkpro-field-live/blackjack/`

## What's in it

| Section | What it does |
| --- | --- |
| **Home** | Welcome, rank and level, XP bar, training streak, strategy accuracy, continue learning, quick play, the Daily Ten, recent achievements, a recommended next lesson, and your most-missed hand. |
| **Play Blackjack** | Casino simulator with three rooms. **Practice Table**: coaching on every decision as you make it, plus hints. **Atlantic City Floor**: other players (each with their own style), hand-signal controls, dealer procedure and patter. Pitch games (1–2 decks) use the face-down signals. **Online Casino**: buttons, insurance pop-ups, faster pace. Every room ends each hand with a Teaching Dealer breakdown, and a session summary keeps results and decision quality separate. |
| **Learn** | 52 lessons in 7 levels: Fundamentals, Etiquette & Hand Signals, Player Decisions, Insurance & Side Bets, Basic Strategy Mastery, Mathematics, and Advanced Strategy & Card Counting. Lessons mix short reading, quizzes, graded hands and 26 interactive widgets. Each level unlocks the next, and experienced players can unlock a level early. |
| **Practice** | Teacher mode (hint first), Challenge mode, Rapid fire (speed and accuracy scored separately), Weakness training (weighted toward the hands you miss), and the Daily Challenge (the same ten hands for everyone each day). You can filter drills to hard, soft, pairs, doubles or surrender. |
| **Casino Etiquette** | Animated signal demos for face-up and face-down games, a signal trainer, a step-by-step night at the table, the table layout, chips, and rookie mistakes. |
| **Strategy** | Basic strategy chart generated for your exact rules (tap any cell to see why), worked examples with EV bars, and a reference library: payouts, signals, glossary, common mistakes and rule effects. The reference drawer opens from any screen. |
| **Card Counting** | Hi-Lo card values, running count streams, full-deck countdown, true count conversion, discard-tray estimation, counting at a live 6-deck table, and the Illustrious 18. |
| **My Progress** | Decision accuracy overall, by action and by hand type. Outcomes are shown next to it but kept separate, including "right play, lost" and "wrong play, won" counts. Also: improvement over time, most frequent mistakes, lessons, counting stats, personal bests, and 27 achievements. |

### Rewards follow learning, not gambling

XP comes only from correct decisions, lessons, drills, daily challenges and streaks. Winning chips, bet size and session length earn nothing. Running out of training chips gets a free reset and a note about session budgets.

## Architecture

```
src/engine/       pure TypeScript, no React; fully unit tested
  rng.ts          seeded PRNG (mulberry32); live games are seeded from crypto.getRandomValues
  cards.ts        cards, Fisher–Yates shoes, cut card / penetration, stacked shoes for tests
  hand.ts         hard/soft totals, naturals vs split-21, pairs
  rules.ts        table rules (decks, S17/H17, 3:2/6:5, DAS, late surrender, resplits, split aces, double restrictions, limits, hands at once) and presets
  dealer.ts       dealer drawing and peek rules
  game.ts         round state machine: betting → insurance/even money → peek → players (incl. NPC seats) → dealer → settlement; shared wallets for multi-spot play
  strategy.ts     rule-specific basic strategy charts and recommendations with fallbacks
  ev.ts           expected-value calculator: dealer outcome distributions, stand/hit/double/split/surrender EVs, house edge, effects of removal
  teaching.ts     the Teaching Dealer: per-decision feedback, per-hand breakdowns, the 4-way verdict (correct/wrong × won/lost), hints
  drills.ts       practice-hand generator, weakness weighting, daily challenge
  count.ts        Hi-Lo, true count, bet ramp, Illustrious 18
  sim.ts          fast basic-strategy simulator (variance, risk of ruin)
  sidebets.ts     exact Perfect Pairs and 21+3 math by combination counting
src/content/      curriculum, glossary, dealer dialogue (all wording in one reviewable place)
src/state/        progress model (XP, levels, streaks, achievements), local store, optional Supabase sync
src/components/   table, cards, chips, signals, charts, trainers, lesson widgets
src/pages/        the eight destinations plus Lesson and Settings
```

Every outcome comes from the engine's shuffled shoe. Every probability or EV the app shows is computed, not typed in. Where a number comes from the infinite-deck model, the app says so.

### How the strategy is verified

- **Charts** follow published total-dependent basic strategy (4–8 deck, double deck, single deck; S17/H17; DAS on or off; late surrender on or off).
- **Fixtures** check specific hands against those published charts (`src/engine/__tests__/strategy.test.ts`).
- **Cross-check:** for every two-card hand against every upcard, under S17 and H17, with and without surrender, the multi-deck chart's choice is compared with the EV calculator's best option. Only two documented knife-edge cells differ (soft 13 vs 5 and soft 15 vs 4), by less than 0.1%.
- **EV engine checks:** dealer bust rates match Griffin's published infinite-deck values to 0.1%. Rule costs match published figures: H17 +0.22%, 6:5 +1.35%, surrender −0.09%, no-DAS +0.12%. Effects of removal match Griffin's. Perfect Pairs (6 decks, 25/12/6) comes out at 6.11%.
- **Known simplification:** split EVs don't model resplits, so they are slightly conservative.

## Develop

```
cd blackjack-app
npm install
npm run dev          # local dev server
npm test             # unit tests (Vitest)
npm run build        # type-checks and builds into ../blackjack (what GitHub Pages serves)
npm run e2e          # end-to-end checks in headless Chromium against the build
```

The built files in `../blackjack/` are committed so GitHub Pages can serve them without a build step, the same way the rest of this repo works. Rebuild after any source change.

The e2e suite deals from stacked shoes using a test hook: if `localStorage['bj-test-shoe']` holds card codes (`"10S 6H 9D …"`), the table deals in that order. Normal play never sets it.

## Progress and accounts

Progress saves to `localStorage` on every change, works offline, and syncs between open tabs. Settings can export and import it as JSON.

**Optional cloud sync (Supabase), not configured in this build:**

1. Create a Supabase project and run `supabase/schema.sql`. It creates a `bj_progress` table with row-level security so each user can only read and write their own row.
2. Enable **Email** sign-in (magic link) under Authentication. Add the site URL to the redirect allow-list.
3. Build with `VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… npm run build`.

Settings will then offer "Email me a link". When a device signs in, the newer save wins, and later changes upload a moment after they happen.

---

Educational simulator only. If gambling stops being fun, call or text 1-800-GAMBLER.

## Test status

- `npm test`: 164 unit tests covering the deck and shoe, hand evaluation, dealer S17/H17, every settlement path, double, split and resplit rules, split Aces, surrender, insurance and even money, multi-spot wallets, chip conservation over 400 random rounds, the strategy fixtures and EV cross-check, the simulator, side-bet math, drills, the teaching verdicts, and progress, XP and achievements.
- `npm run e2e`: 95 browser checks covering all navigation, scripted hands for each move (insurance, 3:2 and 6:5 payouts, S17 vs H17), grading that ignores the outcome, progress after a reload, every one of the 52 lessons played through, practice modes, the daily challenge, counting drills, and no horizontal scroll at iPhone width.
