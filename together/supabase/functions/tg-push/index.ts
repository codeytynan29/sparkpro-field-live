// ── Together: push notifications ────────────────────────────────────────────
// One function, four jobs:
//   subscribe       a phone saves its push subscription + reminder time
//   unsubscribe     a phone turns reminders off
//   notify-partner  "Mom just checked in" / a new note, sent to the other phone
//   test            send a sample tip to the caller's own phone
//   daily           called by pg_cron every 5 min; sends each phone's own
//                   reminders (any number, any times) in its own time zone
// Phone requests carry the user's Supabase JWT and are checked here; the cron
// call carries a shared secret from tg_config. Hence verify_jwt is off.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

let cfg: Record<string, string> | null = null
async function config() {
  if (cfg) return cfg
  const { data, error } = await sb.from('tg_config').select('key,value')
  if (error) throw error
  cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
  webpush.setVapidDetails('https://codeytynan29.github.io', cfg.vapid_public, cfg.vapid_private)
  return cfg
}

// ── Tips ────────────────────────────────────────────────────────────────────
const MOM_TIPS = [
  'Have you had a glass of water in the last hour? 💧',
  'Take a moment for yourself today. Even 5 quiet minutes counts. 🤍',
  'Did you take your prenatal vitamin today?',
  'Small snacks every 2–3 hours keep nausea and dizziness down.',
  'Rest is part of the work. Feet up for a bit if you can.',
  'You\'re doing an amazing job growing a whole person.',
  'Stand up slowly today. Blood pressure dips are normal right now.',
  'Fresh air helps. Even a short walk counts.',
  'If something feels off, the OB line is there for exactly that.',
  'Whatever you got done today is enough.',
]
const DAD_TIPS = [
  'Did you do one thing off her list today without being asked?',
  'Refill her water bottle. Small and consistent beats grand. 💧',
  'Take a moment for yourself: try the 2-minute breathing reset in the You tab.',
  'Ask her: "Do you want comfort, distraction, or space?"',
  'Trash, litter box, fridge. Still your department.',
  'Tell her one specific thing you appreciate about how she\'s handling this.',
  'Is the next appointment in your calendar?',
  'Check in with yourself: how\'s your stress today? Log it in the You tab.',
  'Plan a low-key evening: her pick of food and show.',
  'Being steady is the biggest thing you can give her right now.',
]
// When she logged a symptom today, his tip is about that
const SYMPTOM_NUDGE: Record<string, string> = {
  nausea: 'She logged nausea today. Did you put crackers and water by the bed?',
  vomiting: 'She\'s been vomiting. Keep small sips coming. If she can\'t keep fluids down for 24 hours, call the OB.',
  fatigue: 'She\'s exhausted today. Can you take dinner and dishes completely off her plate?',
  breasts: 'She\'s sore today. Gentle hugs, from the side or behind.',
  cramping: 'She logged cramping. Heating pad on low and let her rest. Strong or one-sided pain means call the OB.',
  spotting: 'She logged spotting. Stay calm, help her note color and amount, and call the OB line if it\'s more than light.',
  bloating: 'She\'s bloated today. An easy walk together after dinner helps.',
  headache: 'She has a headache. Water, a snack and a dark room first.',
  burning: 'She logged burning when peeing. Did she call the OB today? UTIs need treatment.',
  moody: 'She\'s feeling moody. Listen without fixing tonight.',
  anxious: 'She\'s anxious today. Ask what\'s on her mind and just listen.',
  aversions: 'Food aversions today. Ask what sounds OK and go get it.',
  cravings: 'She has a craving. Go get the thing. ❤️',
  heartburn: 'Heartburn today. Smaller dinner, and no lying down right after.',
  dizzy: 'She was dizzy today. Keep snacks handy and remind her to stand up slowly.',
  insomnia: 'She\'s not sleeping well. Wind down together tonight, with screens off early.',
  congestion: 'Stuffy nose today. A humidifier in the bedroom tonight helps.',
  backpain: 'Her back hurts. Offer a lower-back rub tonight.',
  swelling: 'She has swelling. Feet up, and watch for sudden face or hand swelling.',
  fever: 'She logged a fever. Did she call the OB? 100.4°F or higher needs a call.',
  movement: 'She noticed less movement. If it\'s still reduced, call labor & delivery now.',
}

function localParts(tz: string, d = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  const p = Object.fromEntries(f.formatToParts(d).map(x => [x.type, x.value]))
  const hour = Number(p.hour) % 24
  return { date: `${p.year}-${p.month}-${p.day}`, hour, minutes: hour * 60 + Number(p.minute) }
}
const dayNum = (date: string) => Math.floor(Date.parse(date) / 86400000)

async function herCheckinToday(coupleId: string, tz: string) {
  const { data } = await sb.from('tg_entries').select('data,created_at')
    .eq('couple_id', coupleId).eq('kind', 'checkin').eq('author_role', 'mom')
    .order('created_at', { ascending: false }).limit(1)
  const ci = data?.[0]
  if (!ci) return null
  return localParts(tz, new Date(ci.created_at)).date === localParts(tz).date ? ci.data : null
}

async function tipFor(sub: { role: string; couple_id: string; tz: string }) {
  const today = localParts(sub.tz).date
  const n = dayNum(today)
  const ci = await herCheckinToday(sub.couple_id, sub.tz)
  if (sub.role === 'dad') {
    if (ci) {
      const syms = Object.entries(ci.symptoms || {}).sort((a, b) => (b[1] as number) - (a[1] as number))
      const top = syms.find(([id]) => SYMPTOM_NUDGE[id])
      if (top) return { title: 'Today\'s game plan', body: SYMPTOM_NUDGE[top[0]] }
      if (ci.mood && ci.mood <= 2) return { title: 'Today\'s game plan', body: 'She\'s having a rough day. Clear tonight\'s plans and keep things low-key.' }
    } else if (n % 2 === 0) {
      return { title: 'Together', body: 'No check-in from her yet today. Send a quick "How are you feeling?"' }
    }
    return { title: 'Daily tip', body: DAD_TIPS[n % DAD_TIPS.length] }
  }
  if (!ci && n % 2 === 0) return { title: 'How are you feeling today?', body: 'Tap to check in. It takes 20 seconds.' }
  return { title: 'Daily tip', body: MOM_TIPS[n % MOM_TIPS.length] }
}

const MOM_CHECKIN = [
  { title: 'How are you feeling right now? 🤍', body: 'Tap to check in. It takes 20 seconds.' },
  { title: 'Quick check-in', body: 'How\'s your body doing? Log it so you both know what today needs.' },
  { title: 'Checking in on you', body: 'Any symptoms, cravings or worries? A quick log helps him help you.' },
]
const DAD_CHECKIN = [
  { title: 'How are you doing?', body: 'Take 20 seconds to check in with yourself. Your stress matters too.' },
  { title: 'Quick self check-in', body: 'Stress level, what\'s on your mind. Log it in the You tab.' },
]
async function checkinReminder(sub: Sub, slot: number) {
  if (sub.role === 'mom') {
    // she logged in the last 2 hours: don't nag
    const { data } = await sb.from('tg_entries').select('created_at').eq('couple_id', sub.couple_id)
      .eq('kind', 'checkin').eq('author_role', 'mom').order('created_at', { ascending: false }).limit(1)
    if (data?.[0] && Date.now() - Date.parse(data[0].created_at) < 2 * 3600 * 1000) return null
    return MOM_CHECKIN[slot % MOM_CHECKIN.length]
  }
  return DAD_CHECKIN[slot % DAD_CHECKIN.length]
}

type Reminder = { time: string; kind: 'checkin' | 'tip' }
function remindersOf(s: Sub): Reminder[] {
  const list = Array.isArray(s.reminders) ? s.reminders : []
  return list.length ? list : [{ time: `${String(s.hour).padStart(2, '0')}:00`, kind: 'tip' }]
}
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

// ── Sending ─────────────────────────────────────────────────────────────────
type Sub = { endpoint: string; p256dh: string; auth: string; role: string; couple_id: string; tz: string; hour: number; last_sent: string | null; reminders?: Reminder[]; sent_keys?: string[] }

async function send(sub: Sub, msg: { title: string; body: string; tag?: string }) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title: msg.title, body: msg.body, tag: msg.tag || 'together' }),
      { TTL: 60 * 60 * 6 },
    )
    return true
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode
    if (code === 404 || code === 410) await sb.from('tg_push_subs').delete().eq('endpoint', sub.endpoint)
    else console.error('push failed', code, (e as Error).message)
    return false
  }
}

async function caller(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data } = await sb.auth.getUser(token)
  return data.user
}

async function membership(userId: string) {
  const { data } = await sb.from('tg_members').select('couple_id,role').eq('user_id', userId).order('joined_at', { ascending: false }).limit(1)
  return data?.[0] || null
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const c = await config()
    const body = await req.json().catch(() => ({}))
    const action = body.action

    if (action === 'daily') {
      if (req.headers.get('x-cron-secret') !== c.cron_secret) return json({ error: 'forbidden' }, 403)
      const { data: subs } = await sb.from('tg_push_subs').select('*')
      let sent = 0
      for (const s of (subs || []) as Sub[]) {
        const now = localParts(s.tz)
        const done = new Set((s.sent_keys || []).filter(k => k.startsWith(now.date)))
        // a reminder fires once, in the 10 minutes after its time (cron runs every 5)
        const due = remindersOf(s).filter(r => {
          const t = toMin(r.time)
          return now.minutes >= t && now.minutes < t + 10 && !done.has(`${now.date} ${r.time}`)
        })
        if (!due.length) continue
        due.forEach(r => done.add(`${now.date} ${r.time}`))
        // mark first so an overlapping run can't double-send
        await sb.from('tg_push_subs').update({ sent_keys: [...done], last_sent: now.date }).eq('endpoint', s.endpoint)
        for (const r of due) {
          const msg = r.kind === 'checkin' ? await checkinReminder(s, toMin(r.time)) : await tipFor(s)
          if (msg && await send(s, { ...msg, tag: r.kind })) sent++
        }
      }
      return json({ ok: true, sent })
    }

    const user = await caller(req)
    if (!user) return json({ error: 'not signed in' }, 401)
    const m = await membership(user.id)
    if (!m) return json({ error: 'not paired' }, 400)

    if (action === 'subscribe') {
      const s = body.subscription
      if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) return json({ error: 'bad subscription' }, 400)
      let tz = String(body.tz || 'America/Los_Angeles')
      try { new Intl.DateTimeFormat('en', { timeZone: tz }) } catch { tz = 'America/Los_Angeles' }
      const hour = Math.min(23, Math.max(0, Number(body.hour) | 0))
      const reminders = (Array.isArray(body.reminders) ? body.reminders : [])
        .filter((r: Reminder) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(r?.time)) && (r.kind === 'checkin' || r.kind === 'tip'))
        .slice(0, 24).map((r: Reminder) => ({ time: r.time, kind: r.kind }))
      const { error } = await sb.from('tg_push_subs').upsert({
        endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth,
        user_id: user.id, couple_id: m.couple_id, role: m.role, tz, hour, reminders,
      }, { onConflict: 'endpoint' })
      if (error) throw error
      return json({ ok: true })
    }

    if (action === 'unsubscribe') {
      await sb.from('tg_push_subs').delete().eq('endpoint', String(body.endpoint || '')).eq('user_id', user.id)
      return json({ ok: true })
    }

    if (action === 'test') {
      const { data: subs } = await sb.from('tg_push_subs').select('*').eq('user_id', user.id)
      let sent = 0
      for (const s of (subs || []) as Sub[]) if (await send(s, await tipFor(s))) sent++
      return json({ ok: true, sent })
    }

    if (action === 'notify-partner') {
      const other = m.role === 'mom' ? 'dad' : 'mom'
      const who = String(body.name || (m.role === 'mom' ? 'Mom' : 'Dad')).slice(0, 40)
      const kind = body.kind === 'note' ? 'note' : 'checkin'
      const text = String(body.text || '').slice(0, 140)
      const msg = kind === 'note'
        ? { title: `💌 ${who}`, body: text || 'Sent you a note', tag: 'note' }
        : body.title
          // the app composes "She logged nausea today. Try X, or maybe Y."
          ? { title: String(body.title).slice(0, 80), body: String(body.body || '').slice(0, 220), tag: 'checkin' }
          : { title: `${who} just checked in`, body: 'Tap to see how she\'s feeling and today\'s game plan.', tag: 'checkin' }
      const { data: subs } = await sb.from('tg_push_subs').select('*').eq('couple_id', m.couple_id).eq('role', other)
      let sent = 0
      for (const s of (subs || []) as Sub[]) if (await send(s, msg)) sent++
      return json({ ok: true, sent })
    }

    return json({ error: 'unknown action' }, 400)
  } catch (e) {
    console.error(e)
    return json({ error: (e as Error).message }, 500)
  }
})
