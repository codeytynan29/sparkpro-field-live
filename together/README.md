# Together: a shared pregnancy app for couples

A phone-first web app (installable to the home screen) for two people going through one pregnancy together.

- **Her daily check-in:** mood, energy, symptoms (mild/moderate/strong), temperature, and notes. Each symptom explains what it usually means and when it's worth a call.
- **His live view:** her check-in plus a **game plan** for today ("she logged nausea + exhaustion → crackers on the nightstand, take over cooking, own a chore").
- **Red-flag alerts:** some entries put a "Worth a call" banner and a one-tap call to the OB on both phones. Examples: burning when peeing, a fever of 100.4°F or higher, strong cramping, or spotting that's heavier than light.
- **"Is it safe?" lookup:** about 40 OTC medications and 30 foods, each rated ✅ / 🟡 ask / ⛔ avoid, following ACOG / FDA / CDC / MotherToBaby guidance. Every entry still says to confirm with her OB, midwife, or pharmacist.
- **Partner's own space:** his stress level and feelings, coping steps for each feeling, a box-breathing timer, and crisis resources (988, PSI). He can keep a check-in private to his phone.
- **Shared timeline:** notes, ❤️ reactions, and shared appointments.
- **Plan:** a week-by-week milestone timeline dated from the LMP (NIPT from week 10, NT scan at 11–14, anatomy scan at 18–22, glucose test at 24–28, Tdap at 27–36, GBS at 36–37), plus the due date, baby size, and partner tips by trimester.

No accounts and no algorithm guessing. Only what you two log.

## Running it

It's static files with no build step. Once the branch is on GitHub Pages it lives at
`https://codeytynan29.github.io/sparkpro-field-live/together/`.
On iPhone: open it in Safari → Share → **Add to Home Screen**.

## Turning on live sync between two phones

Out of the box it runs in **single-device mode**, and data stays in that phone's browser storage. To make it a shared "joint account":

1. Create a free Supabase project (keep it separate from SparkPro).
2. In **SQL Editor**, run `supabase/schema.sql`.
3. **Authentication → Sign In / Providers →** turn on **Allow anonymous sign-ins**.
4. Put the project URL and publishable (anon) key into `config.js`, then commit.
5. Phone 1: Plan → Pairing → **Create a couple code**. Phone 2: pick the other role → **Join with a code**.

Each phone signs in anonymously. Row Level Security lets a device read and write only the entries of the couple it joined, and a code admits at most 6 devices. Check-ins made offline are queued and sent when signal returns.

## Editing

The page loads one plain script, `app.bundle.js`, built from the modules below. After changing any of them:

```
python3 together/build.py      # bundles, syntax-checks, stamps index.html with a content hash
node together/tests/run.mjs    # 11 end-to-end checks in headless Chromium (needs Playwright)
```

The sync library (`vendor/supabase-js-2.45.4/`) ships with the app, so nothing loads from a CDN.

## Files

| File | What |
| --- | --- |
| `content.js` | All medical/food/symptom/tips wording, in one reviewable place |
| `app.js` | Screens and interactions |
| `sync.js` | Local-first entry ledger + Supabase realtime sync |
| `config.js` | Backend URL/key (blank = single-device) |
| `supabase/schema.sql` | Tables, RLS policies, pairing functions |

*Educational information, not medical advice. In an emergency call 911.*
