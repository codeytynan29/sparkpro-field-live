// ── Together: push notifications ────────────────────────────────────────────
// One function, four jobs:
//   subscribe       a phone saves its push subscription + reminder time
//   unsubscribe     a phone turns reminders off
//   notify-partner  "Mom just checked in" / a new note, sent to the other phone
//   test            send a sample tip to the caller's own phone
//   devices         list this couple's phones; remove-device drops one
//   daily           called by pg_cron every 5 min; sends each phone's own
//                   reminders (any number, any times) in its own time zone,
//                   sends any partner alert a phone failed to send (offline,
//                   app closed too fast), and prunes forgotten devices
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
  'Did you do one thing off {m:their} list today without being asked?',
  'Refill {m:their} water bottle. Small and consistent beats grand. 💧',
  'Take a moment for yourself: try the 2-minute breathing reset in the You tab.',
  'Ask {m:them}: "Do you want comfort, distraction, or space?"',
  'Trash, litter box, fridge. Still your department.',
  'Tell {m:them} one specific thing you appreciate about how {m:they} {m:is|are} handling this.',
  'Is the next appointment in your calendar?',
  'Check in with yourself: how\'s your stress today? Log it in the You tab.',
  'Plan a low-key evening: {m:their} pick of food and show.',
  'Being steady is the biggest thing you can give {m:them} right now.',
]
// When the pregnant partner logged a symptom today, the other partner's tip is about that
const SYMPTOM_NUDGE: Record<string, string> = {
  nausea: '{M:they} logged nausea today. Did you put crackers and water by the bed?',
  vomiting: '{M:they} {m:has|have} been vomiting. Keep small sips coming. If {m:they} can\'t keep fluids down for 24 hours, call the OB.',
  fatigue: '{M:they} {m:is|are} exhausted today. Can you take dinner and dishes completely off {m:their} plate?',
  breasts: '{M:they} {m:is|are} sore today. Gentle hugs, from the side or behind.',
  cramping: '{M:they} logged cramping. Heating pad on low and let {m:them} rest. Strong or one-sided pain means call the OB.',
  spotting: '{M:they} logged spotting. Stay calm, help {m:them} note color and amount, and call the OB line if it\'s more than light.',
  bloating: '{M:they} {m:is|are} bloated today. An easy walk together after dinner helps.',
  headache: '{M:they} {m:has|have} a headache. Water, a snack and a dark room first.',
  burning: '{M:they} logged burning when peeing. Did {m:they} call the OB today? UTIs need treatment.',
  moody: '{M:they} {m:is|are} feeling moody. Listen without fixing tonight.',
  anxious: '{M:they} {m:is|are} anxious today. Ask what\'s on {m:their} mind and just listen.',
  aversions: 'Food aversions today. Ask what sounds OK and go get it.',
  cravings: '{M:they} {m:has|have} a craving. Go get the thing. ❤️',
  heartburn: 'Heartburn today. Smaller dinner, and no lying down right after.',
  dizzy: '{M:they} {m:was|were} dizzy today. Keep snacks handy and remind {m:them} to stand up slowly.',
  insomnia: '{M:they} {m:is|are} not sleeping well. Wind down together tonight, with screens off early.',
  congestion: 'Stuffy nose today. A humidifier in the bedroom tonight helps.',
  backpain: '{M:their} back hurts. Offer a lower-back rub tonight.',
  swelling: '{M:they} {m:has|have} swelling. Feet up, and watch for sudden face or hand swelling.',
  fever: '{M:they} logged a fever. Did {m:they} call the OB? 100.4°F or higher needs a call.',
  movement: '{M:they} noticed less movement. If it\'s still reduced, call labor & delivery now.',
}

// ── Pronouns & parent terms ─────────────────────────────────────────────────
// Text says {m:they}/{p:their}/{m:is|are}… ("m" = the pregnant person, "p" =
// the partner); tpl() fills them in from the couple's profile, same as the app.
type Prof = Record<string, string>
const PRON: Record<string, { they: string; them: string; their: string; theirs: string; themselves: string; plural: boolean }> = {
  she: { they: 'she', them: 'her', their: 'her', theirs: 'hers', themselves: 'herself', plural: false },
  he: { they: 'he', them: 'him', their: 'his', theirs: 'his', themselves: 'himself', plural: false },
  they: { they: 'they', them: 'them', their: 'their', theirs: 'theirs', themselves: 'themselves', plural: true },
}
function tpl(s: string, p: Prof) {
  return s.replace(/\{([mpMP]):([^{}]+)\}/g, (_, who: string, w: string) => {
    const k = who.toLowerCase() === 'm' ? 'mom' : 'dad'
    const pr = PRON[p[k + 'Pron'] || (k === 'mom' ? 'she' : 'he')] || PRON.they
    let out: string
    if (w.includes('|')) { const [a, b] = w.split('|'); out = pr.plural ? b : a }
    else if (w === 'term') out = p[k + 'Term'] || (k === 'mom' ? 'Mom' : 'Dad')
    else if (w === 'name') out = p[k + 'Name'] || p[k + 'Term'] || (k === 'mom' ? 'Mom' : 'Dad')
    else out = (pr as Record<string, string | boolean>)[w] as string ?? w
    return who === who.toUpperCase() ? out.charAt(0).toUpperCase() + out.slice(1) : out
  })
}
const fillMsg = <T extends { title: string; body: string }>(m: T, p: Prof): T => ({ ...m, title: tpl(m.title, p), body: tpl(m.body, p) })

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
  return fillMsg(await rawTipFor(sub), await profileFor(sub.couple_id))
}
async function rawTipFor(sub: { role: string; couple_id: string; tz: string }) {
  const today = localParts(sub.tz).date
  const n = dayNum(today)
  const ci = await herCheckinToday(sub.couple_id, sub.tz)
  if (sub.role === 'dad') {
    if (ci) {
      const syms = Object.entries(ci.symptoms || {}).sort((a, b) => (b[1] as number) - (a[1] as number))
      const top = syms.find(([id]) => SYMPTOM_NUDGE[id])
      if (top) return { title: 'Today\'s game plan', body: SYMPTOM_NUDGE[top[0]] }
      if (ci.mood && ci.mood <= 2) return { title: 'Today\'s game plan', body: '{M:they} {m:is|are} having a rough day. Clear tonight\'s plans and keep things low-key.' }
    } else if (n % 2 === 0) {
      return { title: 'Together', body: 'No check-in from {m:them} yet today. Send a quick "How are you feeling?"' }
    }
    return { title: 'Daily tip', body: DAD_TIPS[n % DAD_TIPS.length] }
  }
  if (!ci && n % 2 === 0) return { title: 'How are you feeling today?', body: 'Tap to check in. It takes 20 seconds.' }
  return { title: 'Daily tip', body: MOM_TIPS[n % MOM_TIPS.length] }
}

const MOM_CHECKIN = [
  { title: 'How are you feeling right now? 🤍', body: 'Tap to check in. It takes 20 seconds.' },
  { title: 'Quick check-in', body: 'How\'s your body doing? Log it so you both know what today needs.' },
  { title: 'Checking in on you', body: 'Any symptoms, cravings or worries? A quick log helps {p:them} help you.' },
]
const DAD_CHECKIN = [
  { title: 'How are you doing?', body: 'Take 20 seconds to check in with yourself. Your stress matters too.' },
  { title: 'Quick self check-in', body: 'Stress level, what\'s on your mind. Log it in the You tab.' },
]
async function checkinReminder(sub: Sub, slot: number) {
  if (sub.role === 'mom') {
    // the pregnant partner logged in the last 2 hours: don't nag
    const { data } = await sb.from('tg_entries').select('created_at').eq('couple_id', sub.couple_id)
      .eq('kind', 'checkin').eq('author_role', 'mom').order('created_at', { ascending: false }).limit(1)
    if (data?.[0] && Date.now() - Date.parse(data[0].created_at) < 2 * 3600 * 1000) return null
    return fillMsg(MOM_CHECKIN[slot % MOM_CHECKIN.length], await profileFor(sub.couple_id))
  }
  return fillMsg(DAD_CHECKIN[slot % DAD_CHECKIN.length], await profileFor(sub.couple_id))
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
      { TTL: 60 * 60 * 6, timeout: 8000 },
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

// ── Server-side backstop for partner alerts ─────────────────────────────────
// The phone sends the alert right after saving. If that never happened, the
// cron sweep sends it once the entry reaches the server.
async function markNotified(id: string) {
  await sb.from('tg_notified').upsert({ entry_id: id }, { onConflict: 'entry_id', ignoreDuplicates: true })
}
// The couple's merged profile (names, pronouns, parent terms): every
// kind='profile' entry in created_at order, later non-empty values winning.
async function profileFor(coupleId: string): Promise<Prof> {
  const { data } = await sb.from('tg_entries').select('data').eq('couple_id', coupleId).eq('kind', 'profile').order('created_at', { ascending: true })
  const p: Prof = {}
  for (const r of data || []) for (const [k, v] of Object.entries(r.data || {})) if (v !== '' && v != null) p[k] = String(v)
  return p
}
const namesOf = (p: Prof) => ({ mom: p.momName || p.momTerm || 'Mom', dad: p.dadName || p.dadTerm || 'Dad' })
// deno-lint-ignore no-explicit-any
function alertFor(e: any, p: Prof) {
  const n = namesOf(p)
  const who = e.author_role === 'mom' ? n.mom : n.dad
  if (e.kind === 'note') return { title: `💌 ${who}`, body: String(e.data?.text || 'Sent you a note').slice(0, 140), tag: 'note' }
  if (e.kind === 'registry') return { title: `🎁 ${who} added to the registry`, body: String(e.data?.name || '').slice(0, 120), tag: 'registry' }
  const syms = Object.entries(e.data?.symptoms || {}).sort((a, b) => (b[1] as number) - (a[1] as number))
  const top = syms.find(([id]) => SYMPTOM_NUDGE[id])
  return { title: `${who} just checked in`, body: tpl(top ? SYMPTOM_NUDGE[top[0]] : 'Tap to see how {m:they} {m:is|are} feeling and today\'s game plan.', p), tag: 'checkin' }
}
async function sweepAlerts() {
  // 2-minute grace so the phone's own alert always wins the race
  const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString(), until = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const { data: recent } = await sb.from('tg_entries').select('id, couple_id, author_role, kind, data, created_at')
    .gte('created_at', since).lte('created_at', until).or('and(kind.eq.checkin,author_role.eq.mom),kind.eq.note').limit(200)
  if (!recent?.length) return 0
  const { data: done } = await sb.from('tg_notified').select('entry_id').in('entry_id', recent.map(e => e.id))
  const seen = new Set((done || []).map(d => d.entry_id))
  let sent = 0
  for (const e of recent) {
    if (seen.has(e.id)) continue
    await markNotified(e.id)
    const other = e.author_role === 'mom' ? 'dad' : 'mom'
    const { data: subs } = await sb.from('tg_push_subs').select('*').eq('couple_id', e.couple_id).eq('role', other)
    if (!subs?.length) continue
    const msg = alertFor(e, await profileFor(e.couple_id))
    for (const s of subs as Sub[]) if (await send(s, msg)) sent++
  }
  return sent
}

// A phone that lost its storage re-joins as a new device. Devices nobody has
// opened in 45 days are dropped, but never the most recent one per person, so
// a phone in active use is never kicked out.
async function pruneDevices() {
  const { data } = await sb.from('tg_members').select('couple_id, user_id, role, last_seen').order('last_seen', { ascending: false })
  const newest = new Set<string>()
  const stale = Date.now() - 45 * 864e5
  for (const m of data || []) {
    const k = m.couple_id + ':' + m.role
    if (!newest.has(k)) { newest.add(k); continue }
    if (Date.parse(m.last_seen) < stale) await removeDevice(m.couple_id, m.user_id)
  }
}
async function removeDevice(coupleId: string, userId: string) {
  await sb.from('tg_push_subs').delete().eq('couple_id', coupleId).eq('user_id', userId)
  await sb.from('tg_members').delete().eq('couple_id', coupleId).eq('user_id', userId)
}
// Real browser push services only, so this server never POSTs anywhere else.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/]
const okEndpoint = (u: string) => { try { const x = new URL(u); return x.protocol === 'https:' && PUSH_HOSTS.some(r => r.test(x.hostname)) } catch { return false } }

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
      sent += await sweepAlerts().catch(e => { console.error('sweep', e); return 0 })
      if (new Date().getUTCMinutes() < 5) await pruneDevices().catch(e => console.error('prune', e)) // hourly
      return json({ ok: true, sent })
    }

    const user = await caller(req)
    if (!user) return json({ error: 'not signed in' }, 401)
    const m = await membership(user.id)
    if (!m) return json({ error: 'not paired' }, 400)

    if (action === 'subscribe') {
      const s = body.subscription
      if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth || !okEndpoint(String(s.endpoint))) return json({ error: 'bad subscription' }, 400)
      const { data: existing } = await sb.from('tg_push_subs').select('couple_id').eq('endpoint', s.endpoint).maybeSingle()
      if (existing && existing.couple_id !== m.couple_id) return json({ error: 'bad subscription' }, 400)
      const { count } = await sb.from('tg_push_subs').select('endpoint', { count: 'exact', head: true }).eq('user_id', user.id)
      if (!existing && (count || 0) >= 5) return json({ error: 'too many devices' }, 400)
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

    if (action === 'devices') {
      const { data } = await sb.from('tg_members').select('user_id, role, joined_at, last_seen').eq('couple_id', m.couple_id).order('last_seen', { ascending: false })
      return json({ devices: (data || []).map(d => ({ ...d, me: d.user_id === user.id })) })
    }

    if (action === 'remove-device') {
      const id = String(body.user_id || '')
      if (!id || id === user.id) return json({ error: 'pick another device' }, 400)
      await removeDevice(m.couple_id, id)
      return json({ ok: true })
    }

    if (action === 'notify-partner') {
      // a partner alert is a nudge, not a megaphone: 30 an hour per phone
      const { count } = await sb.from('tg_push_log').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('at', new Date(Date.now() - 3600e3).toISOString())
      if ((count || 0) >= 30) return json({ ok: true, sent: 0, limited: true })
      await sb.from('tg_push_log').insert({ user_id: user.id })
      const other = m.role === 'mom' ? 'dad' : 'mom'
      const prof = await profileFor(m.couple_id)
      const who = String(body.name || namesOf(prof)[m.role === 'mom' ? 'mom' : 'dad']).slice(0, 40)
      const kind = body.kind === 'note' ? 'note' : 'checkin'
      const text = String(body.text || '').slice(0, 140)
      const msg = kind === 'note'
        ? { title: `💌 ${who}`, body: text || 'Sent you a note', tag: 'note' }
        : body.title
          // the app composes "She logged nausea today. Try X, or maybe Y." (already filled in;
          // tpl() only touches any {m:…} tokens left in it)
          ? { title: tpl(String(body.title), prof).slice(0, 80), body: tpl(String(body.body || ''), prof).slice(0, 220), tag: 'checkin' }
          : { title: `${who} just checked in`, body: tpl('Tap to see how {m:they} {m:is|are} feeling and today\'s game plan.', prof), tag: 'checkin' }
      // remember this entry was handled so the server sweep doesn't repeat it
      // (the entry may still be uploading, so a missing row is fine; another couple's row is not)
      const eid = String(body.entry_id || '')
      if (/^[0-9a-f-]{36}$/i.test(eid)) {
        const { data: row } = await sb.from('tg_entries').select('couple_id').eq('id', eid).maybeSingle()
        if (!row || row.couple_id === m.couple_id) await markNotified(eid)
      }
      const { data: subs } = await sb.from('tg_push_subs').select('*').eq('couple_id', m.couple_id).eq('role', other)
      let sent = 0
      for (const s of (subs || []) as Sub[]) if (await send(s, msg)) sent++
      return json({ ok: true, sent })
    }

    return json({ error: 'unknown action' }, 400)
  } catch (e) {
    console.error(e)
    return json({ error: 'Something went wrong on the server. Try again in a minute.' }, 500)
  }
})
