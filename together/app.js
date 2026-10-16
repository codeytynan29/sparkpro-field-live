// ── Together: the app ───────────────────────────────────────────────────────
// No framework, no build step: each screen is a function that returns an HTML
// string, and any state change re-renders the current screen. All user text
// goes through esc() before it touches innerHTML.
import * as C from './content.js?v=6'
import * as S from './sync.js?v=6'
import { VAPID_PUBLIC } from './config.js?v=6'

const $ = sel => document.querySelector(sel)
const app = $('#app')
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const DAY = 86400000

let tab = 'today'
let lookupTab = 'meds'
let lookupQuery = ''
let usView = null // 'her' | 'him' | 'feed'; defaults to the partner's side
let draft = null // in-progress check-in, survives re-renders
let onboardStep = 0
let firstRun = false
let toastTimer = null

// ── Dates ───────────────────────────────────────────────────────────────────
const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
const fmtDate = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const fmtWhen = iso => {
  const d = new Date(iso), days = Math.round((today0() - new Date(d).setHours(0, 0, 0, 0)) / DAY)
  const t = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return days === 0 ? `Today ${t}` : days === 1 ? `Yesterday ${t}` : `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ${t}`
}
const sameDay = (iso, d = new Date()) => new Date(iso).toDateString() === d.toDateString()

// Latest shared profile entry wins, so if either person corrects the LMP the
// other phone follows.
function profile() {
  const p = { ...(S.state.prefs || {}) }
  for (const e of S.state.entries) if (e.kind === 'profile') Object.assign(p, e.data)
  return p
}

function gest() {
  const p = profile()
  // The OB's due date wins when there is one; otherwise estimate from the LMP.
  if (!p.due && !p.lmp) return null
  const due = p.due ? parseDate(p.due) : new Date(parseDate(p.lmp).getTime() + 280 * DAY)
  const lmp = new Date(due.getTime() - 280 * DAY)
  const days = Math.floor((today0() - lmp) / DAY)
  const week = Math.floor(days / 7), day = days % 7
  const tri = week < 14 ? 1 : week < 28 ? 2 : 3
  return { days, week, day, due, lmp, fromDoctor: !!p.due, tri, left: Math.ceil((due - today0()) / DAY), pct: Math.min(100, Math.max(0, days / 280 * 100)) }
}

const names = () => { const p = profile(); return { mom: p.momName || 'Mom', dad: p.dadName || 'Dad' } }
const me = () => S.state.role
const other = () => (me() === 'mom' ? 'dad' : 'mom')
const nameOf = r => names()[r]
// Built-in symptoms plus any she added herself (shared through the profile)
const customSymptoms = () => (profile().customSymptoms || []).map(c => ({
  id: c.id, label: c.label, emoji: '📝', custom: true,
  meaning: 'A symptom you added yourself. If it\'s new, severe or worrying, mention it to the OB.',
  help: ['Ask her how it\'s affecting her today and what would help most.'], flag: '', flagAt: 0,
}))
const symptom = id => C.SYMPTOMS.find(s => s.id === id) || customSymptoms().find(s => s.id === id)
const pick = (arr, seed) => arr[((seed % arr.length) + arr.length) % arr.length]
const dayIndex = () => Math.floor(today0().getTime() / DAY)

function entries(kind, role) {
  return S.state.entries.filter(e => (!kind || e.kind === kind) && (!role || e.author_role === role))
}
const latest = (kind, role) => entries(kind, role).at(-1)

// ── Reasoning over a check-in ───────────────────────────────────────────────
function flagsFor(ci) {
  if (!ci) return []
  const out = []
  for (const [id, lvl] of Object.entries(ci.data.symptoms || {})) {
    const s = symptom(id)
    if (s && s.flag && s.flagAt && lvl >= s.flagAt) out.push({ s, text: s.flag })
  }
  const t = parseFloat(ci.data.temp)
  if (t && ((t >= 100.4 && t < 115) || (t >= 38 && t < 45))) out.push({ s: symptom('fever'), text: `Logged temperature ${t}° — ${symptom('fever').flag}` })
  return out
}

function gamePlan(ci) {
  if (!ci) return []
  const plan = []
  const seen = new Set()
  const add = (t, why) => { if (!seen.has(t)) { seen.add(t); plan.push({ t, why }) } }
  // strongest symptoms first; stronger ones get more tips
  const syms = Object.entries(ci.data.symptoms || {}).sort((a, b) => b[1] - a[1])
  for (const [id, lvl] of syms) {
    const s = symptom(id); if (!s) continue
    s.help.slice(0, lvl >= 2 ? 3 : 2).forEach(t => add(t, `${s.emoji} ${s.label}`))
  }
  ;(C.MOOD_PLAN[ci.data.mood] || []).forEach(t => add(t, 'Mood'))
  ;(C.ENERGY_PLAN[ci.data.energy] || []).forEach(t => add(t, 'Energy'))
  return plan
}

// "She logged nausea & exhaustion today. Try X, or maybe Y."
function nudgeFor(ci) {
  const who = names().mom
  const syms = Object.entries(ci.data.symptoms || {}).sort((a, b) => b[1] - a[1]).filter(([id]) => C.NUDGE[id] && symptom(id))
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1)
  const t = parseFloat(ci.data.temp)
  if ((t >= 100.4 && t < 115) || (t >= 38 && t < 45)) {
    return { title: `⚠️ ${who} logged a temperature of ${t}°`, body: `${C.NUDGE.fever.call} Meanwhile, try ${C.NUDGE.fever.try[0]}.`, urgent: true }
  }
  if (syms.length) {
    const urgent = syms.find(([id, lvl]) => C.NUDGE[id].call && symptom(id).flagAt && lvl >= symptom(id).flagAt)
    const labels = syms.slice(0, 2).map(([id]) => C.SYMPTOM_NOUN[id] || symptom(id).label.toLowerCase())
    const [y, z] = C.NUDGE[syms[0][0]].try
    return {
      title: `${urgent ? '⚠️ ' : ''}${who} logged ${labels.join(' & ')} today`,
      body: urgent ? `${C.NUDGE[urgent[0]].call} Meanwhile, try ${y}.` : `Try ${y}, or maybe ${z}.`,
      urgent: !!urgent,
    }
  }
  const m = C.MOOD_NUDGE[ci.data.mood]
  if (!m) return { title: `${who} just checked in`, body: 'Tap to see how she\'s doing.' }
  return { title: `${who} is ${m.feel}`, body: `${cap('try ' + m.try[0])}, or maybe ${m.try[1]}.` }
}

// ── Shell ───────────────────────────────────────────────────────────────────
// ── Daily tips (push) ───────────────────────────────────────────────────────
// iPhone only delivers web push to apps opened from the home-screen icon
// (iOS 16.4+), so in a Safari tab we explain that instead of failing silently.
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const pushPrefs = () => (S.state.prefs && S.state.prefs.push) || {}
const hourLabel = h => new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: 'numeric' })
const b64key = s => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)) }
const KIND_LABEL = { checkin: '🤍 Check-in', tip: '💡 Tip' }
// Each phone keeps its own list: [{ time: 'HH:MM', kind: 'checkin' | 'tip' }]
function reminders() {
  const pr = pushPrefs()
  if (Array.isArray(pr.reminders)) return pr.reminders
  if (pr.hour != null) return [{ time: String(pr.hour).padStart(2, '0') + ':00', kind: 'tip' }]
  return me() === 'mom'
    ? [{ time: '09:00', kind: 'checkin' }, { time: '14:00', kind: 'checkin' }, { time: '19:30', kind: 'tip' }]
    : [{ time: '08:30', kind: 'tip' }, { time: '20:00', kind: 'checkin' }]
}
function setReminders(list) {
  S.state.prefs = { ...S.state.prefs, push: { ...pushPrefs(), reminders: list.slice().sort((a, b) => a.time.localeCompare(b.time)) } }
  S.save()
}

function remindersCard() {
  const pr = pushPrefs()
  const intro = `<p>${me() === 'dad'
    ? 'Pick as many times as you like. <b>Tip & game plan</b> is built from her check-in ("She logged nausea today. Did you put crackers by the bed?"). <b>Check-in</b> reminds you to log how you\'re doing. You also get an alert the moment she checks in.'
    : 'Pick as many times as you like. <b>Check-in reminders</b> ask how you\'re feeling (skipped if you checked in within the last 2 hours). <b>Tips</b> are gentle self-care nudges. You also get an alert when he sends a note.'}</p>`
  if (!S.syncAvailable() || !S.isPaired()) return intro + '<p class="fine">Pair your phones first (below), then turn this on.</p>'
  if (isIOS && !standalone()) return intro + '<p class="fine"><b>iPhone only allows notifications from the home-screen app.</b> In Safari tap Share → Add to Home Screen, open Together from that icon, and turn this on there.</p>'
  if (!pushSupported()) return intro + '<p class="fine">This browser doesn\'t support notifications. On iPhone, update iOS and use the home-screen app.</p>'
  if (Notification.permission === 'denied') return intro + '<p class="fine">Notifications are blocked. Open iPhone Settings → Notifications → Together → Allow Notifications, then come back.</p>'
  const list = reminders()
  const rows = list.map((r, i) => `<div class="rem">
      <input type="time" data-rem-time="${i}" value="${esc(r.time)}">
      <select data-rem-kind="${i}">${Object.entries(KIND_LABEL).map(([k, l]) => `<option value="${k}" ${r.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="mini del" data-rem-del="${i}" aria-label="Remove">✕</button>
    </div>`).join('')
  return `${intro}
    <div class="rems">${rows || '<p class="fine">No reminders yet. You\'ll still get partner alerts.</p>'}</div>
    <button class="ghost" data-act="rem-add">＋ Add a reminder</button>
    ${pr.on
      ? `<p>✅ <b>On</b> · ${list.length} reminder${list.length === 1 ? '' : 's'} a day. Changes save automatically.</p>
         <button class="ghost" data-act="push-test">Send me a test now</button>
         <button class="ghost danger" data-act="push-off">Turn off</button>`
      : '<button class="big primary" data-act="push-on">🔔 Turn on reminders & alerts</button>'}`
}

async function enablePush() {
  // requestPermission must be the first await so iOS still sees the tap
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') { render(); return toast('Notifications not allowed') }
  await savePushSubscription()
  S.state.prefs = { ...S.state.prefs, push: { ...pushPrefs(), on: true, reminders: reminders() } }; S.save()
}
async function savePushSubscription() {
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64key(VAPID_PUBLIC) })
  const list = reminders()
  const firstTip = list.find(r => r.kind === 'tip')
  await S.push('subscribe', { subscription: sub.toJSON(), reminders: list, hour: firstTip ? +firstTip.time.slice(0, 2) : 9, tz: Intl.DateTimeFormat().resolvedOptions().timeZone })
}
let remSaveTimer = null
function remindersChanged() {
  render()
  if (!pushPrefs().on) return
  clearTimeout(remSaveTimer)
  remSaveTimer = setTimeout(() => savePushSubscription().then(() => toast('Reminders saved'), () => toast('Couldn\'t save reminders. Check your signal.')), 700)
}

function notifyPartner(kind, text, msg) {
  if (S.isPaired()) S.push('notify-partner', { kind, text, name: nameOf(me()), title: msg?.title, body: msg?.body }).catch(e => console.warn('notify failed', e))
}

// ── Personal link ───────────────────────────────────────────────────────────
// iPhones keep separate storage for Safari, the home-screen icon and in-app
// browsers, so a phone can "forget" it was paired. Once paired, the address
// carries ?c=CODE&r=role. Whatever gets bookmarked or added to the home screen
// keeps that key, and opening it on a blank phone quietly re-joins.
const params = new URLSearchParams(location.search)
let autoJoining = false
function personalLink() {
  const u = new URL(location.href)
  u.hash = ''
  u.search = S.state.code && S.state.role ? `?c=${S.state.code}&r=${S.state.role}` : ''
  return u.toString()
}
// Safari throws (and caps replaceState at 100 calls per 10 seconds), so this
// runs at most once per distinct link and can never take a screen down.
let stamped = ''
function stampLink() {
  if (!S.state.code || !S.state.role) return
  const link = personalLink()
  if (link === stamped || link === location.href) return
  stamped = link
  try { history.replaceState(null, '', link) } catch (e) { console.warn('could not update address', e) }
}

// Any crash while drawing a screen shows what went wrong and a way out,
// instead of leaving a blank page.
function render() {
  try { renderScreen() } catch (e) {
    console.error(e)
    app.innerHTML = `<div class="onb center"><div class="hero">🤍</div><h2>Something went wrong</h2>
      <p class="lead">Your check-ins are safe. Tap Repair, and if this keeps happening, send a screenshot of this screen.</p>
      <p class="fine" style="word-break:break-word">${esc(e && (e.stack || e.message) || e).slice(0, 300)}</p>
      <button class="big primary" onclick="tgRepair()">Repair &amp; reload</button></div>`
  }
}

function renderScreen() {
  stampLink()
  if (autoJoining) {
    app.innerHTML = `<div class="onb"><div class="hero">🤍</div><h2 class="center">Reconnecting to your couple…</h2><p class="lead center">One moment.</p></div>`
    return
  }
  if (!S.state.role || onboardStep) { app.innerHTML = onboarding(); return }
  const g = gest()
  const sync = { local: '', live: '<span class="dot live"></span>Live', connecting: '<span class="dot"></span>Connecting', offline: '<span class="dot off"></span>Offline — will sync', unpaired: '<span class="dot off"></span>Not paired' }[S.status]
  app.innerHTML = `
    <header class="top">
      <div>
        <div class="brand">Together</div>
        <div class="sub">${g && g.week >= 0 ? `Week ${g.week} + ${g.day} · ${['', '1st', '2nd', '3rd'][g.tri]} trimester` : 'Dates not set yet'}</div>
      </div>
      <button class="sync" data-go="plan">${sync}</button>
    </header>
    <main>${({ today, checkin, timeline, lookup, registry, plan })[tab]()}</main>
    <nav class="tabs">
      ${[['today', '🏡', 'Today'], ['checkin', '✍️', me() === 'mom' ? 'Check in' : 'You'], ['timeline', '💞', 'Us'], ['lookup', '🔎', 'Safe?'], ['registry', '🎁', 'Registry'], ['plan', '🗓️', 'Plan']]
        .map(([id, i, l]) => `<button data-tab="${id}" class="${tab === id ? 'on' : ''}"><span>${i}</span>${l}</button>`).join('')}
    </nav>`
  if (tab === 'checkin' && me() === 'dad') bindBreath()
}

function toast(msg) {
  let t = $('#toast')
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t) }
  t.textContent = msg; t.className = 'show'
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = '' }, 3200)
}

// ── Onboarding ──────────────────────────────────────────────────────────────
function onboarding() {
  const p = profile()
  if (!S.state.role) {
    return `<div class="onb">
      <div class="hero">🤍</div>
      <h1>Together</h1>
      <p class="lead">A shared pregnancy space for the two of you. She checks in, you both see it, and you get a plan for how to help.</p>
      <p class="q">Who's using this phone?</p>
      <button class="big" data-role="mom">🤰 I'm pregnant</button>
      <button class="big" data-role="dad">🧔 I'm the partner</button>
      <p class="fine">Not medical advice. Guidance follows ACOG, FDA and CDC patient information. Always check with your OB, midwife, or pharmacist.</p>
    </div>`
  }
  if (onboardStep === 2) {
    return `<div class="onb">
      <h2>Connect your two phones</h2>
      ${pairingCard(true)}
      <button class="big" data-act="finish-onboard">${S.isPaired() ? 'Done' : 'Skip for now'}</button>
    </div>`
  }
  {
    return `<div class="onb">
      <h2>Your dates</h2>
      <label class="field"><b>Due date from your doctor</b> (most accurate, and the app counts everything from it)
        <input type="date" id="due" value="${esc(p.due || '')}">
      </label>
      <p class="or">— no due date yet? —</p>
      <label class="field">First day of last period (we'll estimate until the OB gives you a date)
        <input type="date" id="lmp" value="${esc(p.due ? '' : p.lmp || '')}" max="${isoDate(new Date())}">
      </label>
      <div class="row2">
        <label class="field">Her name <input id="momName" value="${esc(p.momName || '')}" placeholder="optional"></label>
        <label class="field">His name <input id="dadName" value="${esc(p.dadName || '')}" placeholder="optional"></label>
      </div>
      <label class="field">OB / midwife phone (for one-tap calling)
        <input id="obPhone" type="tel" value="${esc(p.obPhone || '')}" placeholder="optional">
      </label>
      <button class="big primary" data-act="save-dates">Continue</button>
      <button class="big" data-act="skip-dates">${p.lmp || p.due ? 'Cancel' : 'Skip for now'}</button>
      ${S.syncAvailable() && !S.isPaired() && !p.lmp && !p.due ? '<button class="big" data-act="to-pair">My partner already set this up — join with a code</button>' : ''}
    </div>`
  }
}

function pairingCard(inOnboarding) {
  if (!S.syncAvailable()) {
    return `<div class="card soft">
      <p><b>This copy is running in single-device mode.</b> Everything stays on this phone.</p>
      <p class="fine">Live sync between two phones turns on once a Supabase backend is added to <code>together/config.js</code> (see the README). Until then you can share one device, or export/import a backup from the Plan tab.</p>
    </div>`
  }
  if (S.isPaired()) {
    return `<div class="card soft center">
      <p>Your couple code</p>
      <div class="code">${esc(S.state.code.replace(/(.{4})(.{4})/, '$1-$2'))}</div>
      <p class="fine">On the other phone: open Together → choose the other role → <b>Join with a code</b>.</p>
      <button class="ghost" data-act="share-code">Share code</button>
      <p class="fine"><b>One and done:</b> add Together to your home screen from <i>this</i> page (Share → Add to Home Screen). The icon remembers your pairing, so you never need the code again.</p>
      <button class="ghost" data-act="copy-link">Copy my personal link</button>
      ${inOnboarding ? '' : '<button class="ghost danger" data-act="unpair">Unpair this phone</button>'}
    </div>`
  }
  return `<div class="card soft">
    <p>Pair once and every check-in, note and appointment shows up on both phones as it happens.</p>
    <button class="big primary" data-act="create-couple">Create a couple code</button>
    <p class="or">— or —</p>
    <label class="field">Join with your partner's code
      <input id="joinCode" placeholder="ABCD-2345" autocapitalize="characters" autocomplete="off">
    </label>
    <button class="big" data-act="join-couple">Join</button>
  </div>`
}

// ── Today ───────────────────────────────────────────────────────────────────
function today() {
  const g = gest()
  const n = names()
  const wk = g ? Math.max(4, Math.min(42, g.week)) : 4
  const [fruit, fe, len] = C.BABY_SIZE[wk] || C.BABY_SIZE[4]
  const herCI = latest('checkin', 'mom')
  const herToday = herCI && sameDay(herCI.created_at) ? herCI : null
  const flags = flagsFor(herToday)
  const enc = pick(me() === 'mom' ? C.ENCOURAGE_MOM : C.ENCOURAGE_DAD, dayIndex())
  const upcoming = g ? C.MILESTONES.filter(m => m.week >= g.week).slice(0, 2) : []
  const appts = entries('appointment').filter(a => a.data.date >= isoDate(new Date())).sort((a, b) => a.data.date.localeCompare(b.data.date)).slice(0, 2)
  const lastNote = entries('note', other()).at(-1)

  let main = ''
  if (me() === 'dad') {
    if (herToday) {
      const plan = gamePlan(herToday)
      main = `
        ${checkinCard(herToday, `${esc(n.mom)}'s check-in`)}
        <section class="card">
          <h3>🧭 Your game plan today</h3>
          ${plan.length ? `<ol class="plan">${plan.slice(0, 6).map(p => `<li>${esc(p.t)}<span class="why">${esc(p.why)}</span></li>`).join('')}</ol>
            ${plan.length > 6 ? `<details><summary>${plan.length - 6} more ideas</summary><ol class="plan" start="7">${plan.slice(6).map(p => `<li>${esc(p.t)}<span class="why">${esc(p.why)}</span></li>`).join('')}</ol></details>` : ''}` : '<p>No symptoms logged. Ask her how she\'s doing, and do one thing off her list without being asked.</p>'}
          ${Object.keys(herToday.data.symptoms || {}).length ? `<details><summary>What her symptoms mean</summary>${Object.keys(herToday.data.symptoms).map(id => symptom(id)).filter(Boolean).map(s => `<p><b>${s.emoji} ${esc(s.label)}:</b> ${esc(s.meaning)}</p>`).join('')}</details>` : ''}
        </section>`
    } else {
      main = `<section class="card soft">
        <h3>No check-in from ${esc(n.mom)} yet today</h3>
        <p>A gentle "How are you feeling today?" text beats guessing. You can also send a quick note below.</p>
        ${herCI ? `<p class="fine">Last check-in: ${fmtWhen(herCI.created_at)}</p>` : ''}
      </section>`
    }
    main += `<section class="card"><h3>💡 Guy's-eye view</h3><p>${esc(pick(C.DAD_TRUTHS, dayIndex()))}</p><p class="fine">${esc(pick(C.DAD_TRIMESTER[g ? g.tri : 1], dayIndex()))}</p></section>`
  } else {
    main = herToday
      ? `${checkinCard(herToday, 'Your check-in today')}`
      : `<section class="card prompt">
          <h3>How are you feeling today, ${esc(n.mom === 'Mom' ? 'mama' : n.mom)}?</h3>
          <div class="moods">${C.MOOD.map(m => `<button data-quickmood="${m.v}"><span>${m.emoji}</span>${m.label}</button>`).join('')}</div>
          <p class="fine">Tap one to start. Add symptoms and notes on the next screen.</p>
        </section>`
    const dadCI = entries('dadcheck', 'dad').filter(e => !e.local).at(-1)
    if (dadCI && sameDay(dadCI.created_at)) main += `<section class="card soft"><p>${esc(n.dad)} checked in too: <b>${dadCI.data.feelings?.map(f => C.DAD_FEELINGS.find(x => x.id === f)?.label).filter(Boolean).join(', ') || 'stress ' + dadCI.data.stress + '/5'}</b></p></section>`
  }

  return `
    ${flags.length ? `<section class="card alert"><h3>⚠️ Worth a call</h3>${flags.map(f => `<p>${esc(f.text)}</p>`).join('')}${profile().obPhone ? `<a class="btn" href="tel:${esc(profile().obPhone.replace(/[^0-9+]/g, ''))}">📞 Call OB</a>` : ''} <button class="ghost" data-go-lookup="redflags">When to call</button></section>` : ''}
    ${g ? babyCard(g, wk, fe, fruit, len) : datesCard()}
    ${main}
    ${S.isPaired() && !pushPrefs().on && pushSupported() ? `<section class="card soft"><p>🔔 Want a daily tip, and a heads-up when ${esc(nameOf(other()))} ${me() === 'dad' ? 'checks in' : 'sends a note'}?</p><button class="ghost" data-go="plan">Set up notifications</button></section>` : ''}
    ${lastNote ? `<section class="card note"><div class="from">💌 ${esc(nameOf(other()))} · ${fmtWhen(lastNote.created_at)}</div><p>${esc(lastNote.data.text)}</p></section>` : ''}
    <section class="card">
      <h3>Send ${esc(nameOf(other()))} a little something</h3>
      <div class="chips">${(me() === 'dad' ? ['Thinking of you ❤️', 'Need anything? I\'ll grab it', 'Proud of you', 'Rest — I\'ve got tonight'] : ['Thank you ❤️', 'Rough one, could use a hug', 'Feeling good today!', 'Can you grab me a snack?'])
        .map(t => `<button class="chip" data-sendnote="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </section>
    <section class="card quote"><p>“${esc(enc)}”</p></section>
    ${upcoming.length || appts.length ? `<section class="card"><h3>Coming up</h3>
      ${appts.map(a => `<div class="mile"><b>📅 ${esc(a.data.title)}</b><span>${fmtDate(parseDate(a.data.date))}</span></div>`).join('')}
      ${upcoming.map(m => `<div class="mile"><b>${esc(m.title)}</b><span>Week ${m.week}${m.week > g.week ? ` · ~${fmtDate(new Date(g.lmp.getTime() + m.week * 7 * DAY))}` : ' · now'}</span></div>`).join('')}
    </section>` : ''}`
}

function babyCard(g, wk, fe, fruit, len) {
  return `<section class="card baby">
      <div class="fruit">${fe}</div>
      <div>
        <div class="wk">${g.week < 0 ? 'Not yet' : `Week ${g.week}<small> + ${g.day}d</small>`}</div>
        <div>Baby is about the size of a <b>${esc(fruit)}</b> <span class="fine">(${len})</span></div>
        <div class="fine">${esc(C.WEEK_NOTES[wk] || '')}</div>
      </div>
      <div class="bar"><i style="width:${g.pct}%"></i></div>
      <div class="due">Due ${fmtDate(g.due)}${g.fromDoctor ? '' : ' (estimate)'} · ${g.left > 0 ? `${g.left} days to go` : 'any day now'}</div>
    </section>`
}

function datesCard() {
  return `<section class="card prompt">
    <h3>📅 Add your dates</h3>
    <p>Enter the due date your doctor gave you (or the first day of her last period) to see the week, baby size and upcoming milestones.</p>
    <button class="big primary" data-act="edit-dates">Add dates</button>
    ${S.isPaired() ? '' : '<p class="fine">If your partner already added them, pair your phones (Plan tab) and they\'ll show up here.</p>'}
  </section>`
}

function checkinCard(ci, title) {
  const d = ci.data
  const mood = C.MOOD.find(m => m.v === d.mood)
  const energy = C.ENERGY.find(m => m.v === d.energy)
  const syms = Object.entries(d.symptoms || {})
  const lvl = ['', 'mild', 'moderate', 'strong']
  const hearts = entries('reaction').filter(r => r.data.to === ci.id)
  const nudge = me() === 'dad' && ci.author_role === 'mom' && sameDay(ci.created_at) ? nudgeFor(ci) : null
  return `<section class="card ci">
    <div class="ci-head"><h3>${title}</h3><span class="fine">${fmtWhen(ci.created_at)}</span></div>
    ${nudge ? `<div class="nudge ${nudge.urgent ? 'urgent' : ''}"><b>${esc(nudge.title)}.</b> ${esc(nudge.body)}</div>` : ''}
    <div class="ci-stats">
      ${mood ? `<div><span>${mood.emoji}</span>Mood: ${mood.label}</div>` : ''}
      ${energy ? `<div><span>${energy.emoji}</span>Energy: ${energy.label}</div>` : ''}
      ${d.temp ? `<div><span>🌡️</span>${esc(d.temp)}°</div>` : ''}
    </div>
    ${syms.length ? `<div class="chips">${syms.map(([id, l]) => { const s = symptom(id); return s ? `<span class="chip on l${l}">${s.emoji} ${esc(s.label)} · ${lvl[l]}</span>` : '' }).join('')}</div>` : ''}
    ${d.note ? `<p class="quote-inline">“${esc(d.note)}”</p>` : ''}
    <div class="react">
      ${hearts.length ? `<span>${hearts.map(h => esc(h.data.emoji)).join('')} from ${esc(nameOf(hearts[0].author_role))}</span>` : ''}
      ${ci.author_role !== me() ? ['❤️', '🤗', '💪'].map(e => `<button class="mini" data-react="${ci.id}" data-emoji="${e}">${e}</button>`).join('') : `<button class="mini" data-edit-ci="${ci.id}">✏️ Edit</button>`}
    </div>
  </section>`
}

// ── Check-in ────────────────────────────────────────────────────────────────
function checkin() { return me() === 'mom' ? momCheckin() : dadCheckin() }

function momCheckin() {
  draft = draft && draft.kind === 'checkin' ? draft : { kind: 'checkin', mood: 0, energy: 0, symptoms: {}, temp: '', note: '' }
  const lvl = ['', 'mild', 'moderate', 'strong']
  const g = gest()
  // late-pregnancy-only symptoms are hidden early so the list stays short
  const wkNow = g ? g.week : 0
  const list = [...C.SYMPTOMS.filter(s => !(s.id === 'movement' && wkNow < 24) && !(s.id === 'swelling' && wkNow < 12) && !(s.id === 'backpain' && wkNow < 10)), ...customSymptoms()]
  return `
    ${draft.editing ? `<section class="card soft"><p>✏️ <b>Editing your check-in from ${fmtWhen(entries('checkin').find(e => e.id === draft.editing)?.created_at || new Date().toISOString())}</b></p><button class="ghost" data-act="cancel-edit">Cancel editing</button></section>` : ''}
    <section class="card">
      <h3>How are you feeling today?</h3>
      <div class="moods">${C.MOOD.map(m => `<button data-mood="${m.v}" class="${draft.mood === m.v ? 'on' : ''}"><span>${m.emoji}</span>${m.label}</button>`).join('')}</div>
      <h4>Energy</h4>
      <div class="moods">${C.ENERGY.map(m => `<button data-energy="${m.v}" class="${draft.energy === m.v ? 'on' : ''}"><span>${m.emoji}</span>${m.label}</button>`).join('')}</div>
    </section>
    <section class="card">
      <h3>Anything going on?</h3>
      <p class="fine">Tap once for mild, again for moderate, again for strong, a fourth time to clear.</p>
      <div class="chips">${list.map(s => { const l = draft.symptoms[s.id] || 0; return `<button class="chip ${l ? 'on l' + l : ''}" data-sym="${s.id}">${s.emoji} ${esc(s.label)}${l ? ' · ' + lvl[l] : ''}</button>` }).join('')}<button class="chip add" data-act="add-symptom">＋ Add your own</button></div>
      ${Object.keys(draft.symptoms).length ? `<div class="explain">${Object.entries(draft.symptoms).map(([id, l]) => {
        const s = symptom(id); const flag = s.flag && s.flagAt && l >= s.flagAt
        return `<div class="ex ${flag ? 'warn' : ''}"><b>${s.emoji} ${esc(s.label)}</b><p>${esc(s.meaning)}</p>${s.flag ? `<p class="flag">${flag ? '⚠️ ' : 'Call if: '}${esc(s.flag)}</p>` : ''}</div>`
      }).join('')}</div>` : ''}
    </section>
    <section class="card">
      <label class="field">Temperature (optional, °F or °C)
        <input id="temp" inputmode="decimal" value="${esc(draft.temp)}" placeholder="e.g. 98.6">
      </label>
      <label class="field">Notes for you both
        <textarea id="note" rows="3" placeholder="Anything else? Cravings, worries, wins…">${esc(draft.note)}</textarea>
      </label>
      <button class="big primary" data-act="save-checkin" ${draft.mood ? '' : 'disabled'}>Share check-in</button>
      ${S.isPaired() ? `<p class="fine center">${esc(names().dad)} will see this right away.</p>` : ''}
    </section>
    ${history('checkin', 'mom')}`
}

function dadCheckin() {
  draft = draft && draft.kind === 'dadcheck' ? draft : { kind: 'dadcheck', stress: 0, feelings: [], note: '', private: false }
  const chosen = C.DAD_FEELINGS.filter(f => draft.feelings.includes(f.id))
  return `
    <section class="card">
      <h3>How are <i>you</i> doing?</h3>
      <p class="fine">Your space. You're allowed to not be fine. Check in with yourself here.</p>
      <h4>Stress level</h4>
      <div class="scale">${[1, 2, 3, 4, 5].map(v => `<button data-stress="${v}" class="${draft.stress === v ? 'on' : ''}">${v}</button>`).join('')}</div>
      <div class="scale-l"><span>calm</span><span>maxed out</span></div>
      <h4>What's going on</h4>
      <div class="chips">${C.DAD_FEELINGS.map(f => `<button class="chip ${draft.feelings.includes(f.id) ? 'on' : ''}" data-feel="${f.id}">${f.emoji} ${esc(f.label)}</button>`).join('')}</div>
    </section>
    ${chosen.length ? `<section class="card"><h3>🛠️ What helps</h3>${chosen.map(f => `<h4>${f.emoji} ${esc(f.label)}</h4><ul>${f.cope.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`).join('')}</section>` : ''}
    <section class="card breathe">
      <h3>🫁 Two-minute reset</h3>
      <div class="circle" id="circle"><span id="breathLabel">Tap to start</span></div>
      <p class="fine center">Box breathing: 4 in · 4 hold · 4 out · 4 hold. Slows the heart rate and takes the edge off panic.</p>
    </section>
    <section class="card">
      <label class="field">Notes
        <textarea id="note" rows="3" placeholder="What's on your mind?">${esc(draft.note)}</textarea>
      </label>
      <label class="toggle"><input type="checkbox" id="private" ${draft.private ? 'checked' : ''}> Keep private (stays on this phone only)</label>
      <button class="big primary" data-act="save-dadcheck" ${draft.stress ? '' : 'disabled'}>Save check-in</button>
    </section>
    ${(draft.stress >= 4 || draft.feelings.includes('scared') || draft.feelings.includes('overwhelmed')) ? supportCard() : ''}
    ${history('dadcheck', 'dad')}`
}

function supportCard() {
  return `<section class="card soft">
    <h3>If it's more than a rough patch</h3>
    <p>Around 1 in 10 new and expecting dads get perinatal depression or anxiety. It's common and treatable.</p>
    <ul>
      <li><b>988</b>: call or text, Suicide & Crisis Lifeline (US), 24/7</li>
      <li><b>1-800-944-4773</b>: Postpartum Support International helpline (dads included). Text "Dad" to 1-800-944-4773 for dad-specific support.</li>
      <li>Your own doctor or an EAP through work, often free and confidential.</li>
    </ul>
  </section>`
}

function history(kind, role) {
  const list = entries(kind, role).slice(-7).reverse()
  if (!list.length) return ''
  if (kind === 'checkin') {
    return `<section class="card"><h3>Last 7 check-ins</h3><div class="spark">${list.slice().reverse().map(e => `<div title="${fmtWhen(e.created_at)}"><i style="height:${(e.data.mood || 0) * 20}%"></i><span>${C.MOOD.find(m => m.v === e.data.mood)?.emoji || ''}</span></div>`).join('')}</div></section>`
  }
  return `<section class="card"><h3>Recent</h3>${list.map(e => `<div class="mile"><b>Stress ${e.data.stress}/5 ${e.local ? '🔒' : ''}</b><span>${fmtWhen(e.created_at)}</span></div>`).join('')}</section>`
}

let breathTimer = null
function bindBreath() {
  const c = $('#circle'); if (!c) return
  c.onclick = () => {
    if (breathTimer) { clearInterval(breathTimer); breathTimer = null; c.className = 'circle'; $('#breathLabel').textContent = 'Tap to start'; return }
    let step = 0, sec = 0, rounds = 0
    const tick = () => {
      const [label, len] = C.BREATH_STEPS[step]
      $('#breathLabel') && ($('#breathLabel').textContent = `${label} · ${len - sec}`)
      c.className = 'circle ' + ['in', 'hold-in', 'out', 'hold-out'][step]
      if (++sec >= len) { sec = 0; step = (step + 1) % 4; if (step === 0 && ++rounds >= 8) { clearInterval(breathTimer); breathTimer = null; $('#breathLabel').textContent = 'Nice. 🙌'; c.className = 'circle' } }
    }
    tick(); breathTimer = setInterval(tick, 1000)
  }
}

// ── Timeline ────────────────────────────────────────────────────────────────
// ── Us: both people's experiences ───────────────────────────────────────────
const dayKey = d => isoDate(new Date(d))
const lastDays = n => Array.from({ length: n }, (_, i) => new Date(today0().getTime() - (n - 1 - i) * DAY))
const shortDay = d => d.toLocaleDateString(undefined, { weekday: 'narrow' })
// latest entry of a kind per calendar day, for the last n days
function perDay(kind, role, n) {
  const by = {}
  for (const e of entries(kind, role)) if (!(e.local && me() !== role)) by[dayKey(e.created_at)] = e
  return lastDays(n).map(d => ({ d, e: by[isoDate(d)] }))
}
function bars(days, val, max, label) {
  return `<div class="spark">${days.map(({ d, e }) => {
    const v = e ? val(e) : 0
    return `<div title="${fmtDate(d)}"><i style="height:${v ? Math.max(8, v / max * 100) : 0}%"></i><span class="fine">${label ? label(e) || shortDay(d) : shortDay(d)}</span></div>`
  }).join('')}</div>`
}
function topCounts(list, n) {
  const c = {}
  list.forEach(id => { c[id] = (c[id] || 0) + 1 })
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function timeline() {
  usView = usView || (me() === 'dad' ? 'her' : 'him')
  const n = names()
  const herCI = latest('checkin', 'mom'), hisCI = entries('dadcheck', 'dad').filter(e => !(e.local && me() !== 'dad')).at(-1)
  const moodOf = e => C.MOOD.find(m => m.v === e?.data?.mood)
  const hisFeel = e => (e?.data?.feelings || []).map(id => C.DAD_FEELINGS.find(f => f.id === id)).filter(Boolean)
  const strip = `<div class="duo">
    <button class="duo-card ${usView === 'her' ? 'on' : ''}" data-us="her">
      <div class="fine">🤰 ${esc(n.mom)}</div>
      ${herCI ? `<div class="big-emoji">${moodOf(herCI)?.emoji || '•'}</div><div>${esc(moodOf(herCI)?.label || '')}${Object.keys(herCI.data.symptoms || {}).length ? ` · ${Object.keys(herCI.data.symptoms).length} symptom${Object.keys(herCI.data.symptoms).length > 1 ? 's' : ''}` : ''}</div><div class="fine">${fmtWhen(herCI.created_at)}</div>` : '<div class="big-emoji">–</div><div class="fine">No check-in yet</div>'}
    </button>
    <button class="duo-card ${usView === 'him' ? 'on' : ''}" data-us="him">
      <div class="fine">🧔 ${esc(n.dad)}</div>
      ${hisCI ? `<div class="big-emoji">${hisFeel(hisCI)[0]?.emoji || '🙂'}</div><div>Stress ${hisCI.data.stress}/5</div><div class="fine">${fmtWhen(hisCI.created_at)}</div>` : '<div class="big-emoji">–</div><div class="fine">No check-in yet</div>'}
    </button>
  </div>
  <div class="seg">${[['her', `${esc(n.mom)}'s side`], ['him', `${esc(n.dad)}'s side`], ['feed', 'Notes & feed']].map(([id, l]) => `<button data-us="${id}" class="${usView === id ? 'on' : ''}">${l}</button>`).join('')}</div>`
  return strip + (usView === 'her' ? herSide() : usView === 'him' ? hisSide() : feed())
}

function herSide() {
  const n = names()
  const ci = latest('checkin', 'mom')
  const week = perDay('checkin', 'mom', 7)
  const recent = entries('checkin', 'mom').filter(e => Date.now() - new Date(e.created_at) < 14 * DAY)
  const common = topCounts(recent.flatMap(e => Object.keys(e.data.symptoms || {})), 5)
  const plan = ci && sameDay(ci.created_at) ? gamePlan(ci) : []
  if (!entries('checkin', 'mom').length) return `<section class="card soft center"><p>${me() === 'mom' ? 'Your check-ins' : `${esc(n.mom)}'s check-ins`} will show up here: mood, energy, symptoms and how she's trending.</p>${me() === 'mom' ? '<button class="big primary" data-tab="checkin">Check in now</button>' : ''}</section>`
  return `
    ${ci ? checkinCard(ci, me() === 'mom' ? 'Your latest check-in' : `${esc(n.mom)}'s latest check-in`) : ''}
    <section class="card"><h3>Mood this week</h3>${bars(week, e => e.data.mood, 5, e => moodOf2(e))}
      <h4>Energy</h4>${bars(week, e => e.data.energy || 0, 5)}</section>
    ${common.length ? `<section class="card"><h3>Most common lately</h3>${common.map(([id, c]) => { const s = symptom(id); return s ? `<div class="mile"><b>${s.emoji} ${esc(s.label)}</b><span>${c} day${c > 1 ? 's' : ''} in 2 weeks</span></div>` : '' }).join('')}
      <details><summary>What these mean</summary>${common.map(([id]) => symptom(id)).filter(Boolean).map(s => `<p><b>${s.emoji} ${esc(s.label)}:</b> ${esc(s.meaning)}</p>`).join('')}</details></section>` : ''}
    ${plan.length ? `<section class="card"><h3>🧭 How ${me() === 'dad' ? 'you' : esc(n.dad)} can help today</h3><ol class="plan">${plan.slice(0, 5).map(p => `<li>${esc(p.t)}<span class="why">${esc(p.why)}</span></li>`).join('')}</ol></section>` : ''}`
}
const moodOf2 = e => e ? (C.MOOD.find(m => m.v === e.data.mood)?.emoji || '') : ''

function hisSide() {
  const n = names()
  const visible = entries('dadcheck', 'dad').filter(e => !(e.local && me() !== 'dad'))
  const ci = visible.at(-1)
  const week = perDay('dadcheck', 'dad', 7)
  const recent = visible.filter(e => Date.now() - new Date(e.created_at) < 14 * DAY)
  const common = topCounts(recent.flatMap(e => e.data.feelings || []), 4)
  if (!ci) return `<section class="card soft center"><p>${me() === 'dad' ? 'Your check-ins (stress and what\'s on your mind) show up here for both of you, unless you mark one private.' : `When ${esc(n.dad)} checks in on how he's doing, it shows up here, with ways you can support him.`}</p>${me() === 'dad' ? '<button class="big primary" data-tab="checkin">Check in now</button>' : ''}</section>`
  const feel = (ci.data.feelings || []).map(id => C.DAD_FEELINGS.find(f => f.id === id)).filter(Boolean)
  const support = [...(C.SUPPORT_HIM_STRESS[ci.data.stress] || []), ...feel.flatMap(f => C.SUPPORT_HIM[f.id] || [])].slice(0, 5)
  return `
    <section class="card">
      <div class="ci-head"><h3>${me() === 'dad' ? 'Your latest check-in' : `${esc(n.dad)}'s latest check-in`} ${ci.local ? '🔒' : ''}</h3><span class="fine">${fmtWhen(ci.created_at)}</span></div>
      <div class="ci-stats"><div><span>🌡️</span>Stress ${ci.data.stress}/5</div></div>
      ${feel.length ? `<div class="chips">${feel.map(f => `<span class="chip on">${f.emoji} ${esc(f.label)}</span>`).join('')}</div>` : ''}
      ${ci.data.note ? `<p class="quote-inline">“${esc(ci.data.note)}”</p>` : ''}
    </section>
    <section class="card"><h3>Stress this week</h3>${bars(week, e => e.data.stress, 5, e => e ? String(e.data.stress) : '')}<p class="fine">Higher bar = more stressed.</p></section>
    ${common.length ? `<section class="card"><h3>On his mind lately</h3>${common.map(([id, c]) => { const f = C.DAD_FEELINGS.find(x => x.id === id); return f ? `<div class="mile"><b>${f.emoji} ${esc(f.label)}</b><span>${c}× in 2 weeks</span></div>` : '' }).join('')}</section>` : ''}
    ${support.length ? `<section class="card"><h3>💛 ${me() === 'mom' ? 'How you can support him' : `How ${esc(n.mom)} can support you`}</h3><ol class="plan">${support.map(t => `<li>${esc(t)}</li>`).join('')}</ol></section>` : ''}
    ${me() === 'dad' ? '<p class="fine center">Check-ins marked private stay on your phone and never show here for her.</p>' : ''}`
}

function feed() {
  const list = S.state.entries.filter(e => ['checkin', 'dadcheck', 'note', 'appointment'].includes(e.kind)).slice().reverse().slice(0, 150)
  const n = names()
  return `
    <section class="card compose">
      <textarea id="msg" rows="2" placeholder="Write ${esc(nameOf(other()))} a note…"></textarea>
      <button class="primary" data-act="send-msg">Send</button>
    </section>
    ${list.length ? list.map(e => {
      const who = e.author_role === me() ? 'You' : esc(n[e.author_role])
      const del = e.author_role === me() ? `<button class="mini del" data-del="${e.id}" title="Delete">✕</button>` : ''
      if (e.kind === 'checkin') return checkinCard(e, `${who === 'You' ? 'Your' : who + '\'s'} check-in`).replace('</section>', `${del}</section>`)
      if (e.kind === 'note') return `<section class="card note ${e.author_role === me() ? 'mine' : ''}"><div class="from">${who} · ${fmtWhen(e.created_at)} ${del}</div><p>${esc(e.data.text)}</p></section>`
      if (e.kind === 'appointment') return `<section class="card soft"><div class="from">${who} added an appointment · ${fmtWhen(e.created_at)} ${del}</div><p>📅 <b>${esc(e.data.title)}</b>, ${fmtDate(parseDate(e.data.date))}</p></section>`
      if (e.kind === 'dadcheck') {
        if (e.local && me() !== 'dad') return ''
        const f = (e.data.feelings || []).map(id => C.DAD_FEELINGS.find(x => x.id === id)).filter(Boolean)
        return `<section class="card soft"><div class="from">${who} · ${fmtWhen(e.created_at)} ${e.local ? '🔒 private' : ''} ${del}</div><p>Stress ${e.data.stress}/5 ${f.map(x => x.emoji + ' ' + esc(x.label)).join(', ')}</p>${e.data.note ? `<p class="quote-inline">“${esc(e.data.note)}”</p>` : ''}</section>`
      }
      return ''
    }).join('') : '<section class="card soft center"><p>Nothing yet. Check-ins and notes from both of you will show up here.</p></section>'}`
}

// ── Lookup ──────────────────────────────────────────────────────────────────
function lookup() {
  const q = lookupQuery.trim().toLowerCase()
  const tierL = { ok: '✅ Generally OK', ask: '🟡 Ask first', avoid: '⛔ Avoid' }
  const filt = (arr, keys) => !q ? arr : arr.filter(x => keys.some(k => String(x[k] || '').toLowerCase().includes(q)))
  let body = ''
  if (lookupTab === 'meds') {
    body = filt(C.MEDS, ['name', 'aka', 'use']).map(m => `<details class="item t-${m.tier}"><summary><b>${esc(m.name)}</b>${m.aka ? `<span class="aka">${esc(m.aka)}</span>` : ''}<span class="tier">${tierL[m.tier]}</span></summary>${m.use ? `<p class="fine">For: ${esc(m.use)}</p>` : ''}<p>${esc(m.note)}</p></details>`).join('')
  } else if (lookupTab === 'foods') {
    body = filt(C.FOODS, ['name', 'note']).map(f => `<details class="item t-${f.tier}"><summary><b>${esc(f.name)}</b><span class="tier">${tierL[f.tier]}</span></summary><p>${esc(f.note)}</p></details>`).join('')
  } else if (lookupTab === 'symptoms') {
    body = filt(C.SYMPTOMS, ['label', 'meaning', 'flag']).map(s => `<details class="item"><summary><b>${s.emoji} ${esc(s.label)}</b></summary><p>${esc(s.meaning)}</p><h4>How he can help</h4><ul>${s.help.map(h => `<li>${esc(h)}</li>`).join('')}</ul>${s.flag ? `<p class="flag">Call if: ${esc(s.flag)}</p>` : ''}</details>`).join('')
  } else {
    body = C.RED_FLAGS.map(([h, list], i) => `<section class="card ${i === 0 ? 'alert' : i === 1 ? 'warnc' : 'soft'}"><h3>${esc(h)}</h3><ul>${list.filter(x => !q || x.toLowerCase().includes(q)).map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')
  }
  return `
    <div class="seg">${[['meds', '💊 Meds'], ['foods', '🍽️ Food'], ['symptoms', '🩺 Symptoms'], ['redflags', '🚨 When to call']].map(([id, l]) => `<button data-lt="${id}" class="${lookupTab === id ? 'on' : ''}">${l}</button>`).join('')}</div>
    <input class="search" id="q" type="search" placeholder="Search ${lookupTab === 'meds' ? 'e.g. ibuprofen, Benadryl, sleep' : lookupTab === 'foods' ? 'e.g. sushi, brie, coffee' : '…'}" value="${esc(lookupQuery)}">
    <div class="list">${body || '<p class="fine center">No match. Ask the OB, midwife, or a pharmacist. MotherToBaby (mothertobaby.org, 1-866-626-6847) answers medication questions for free.</p>'}</div>
    <p class="fine center">General guidance for healthy pregnancies, from ACOG, FDA, CDC and MotherToBaby information. It isn't personal medical advice. Doses, trimester, and her own health history matter, so confirm with her OB, midwife, or pharmacist. Free expert answers: MotherToBaby, 1-866-626-6847.</p>`
}

// ── Registry ────────────────────────────────────────────────────────────────
// Shared list: either of you adds, both see who added what, either can tick
// "got it". Store carts can't be read by outside apps, so items keep a link,
// and the couple's own Amazon/Target/Babylist registries are one tap away.
let regFilter = 'need'
let editReg = null
const storeOf = url => { try { const h = new URL(url).hostname.replace(/^www\./, ''); return ({ 'amazon.com': 'Amazon', 'a.co': 'Amazon', 'amzn.to': 'Amazon', 'target.com': 'Target', 'walmart.com': 'Walmart', 'babylist.com': 'Babylist', 'buybuybaby.com': 'buybuy BABY', 'costco.com': 'Costco' })[h] || h } catch { return '' } }
// Amazon product links carry the name: /Graco-SnugRide-Infant-Car-Seat/dp/B0...
function nameFromUrl(url) {
  try {
    const u = new URL(url)
    const m = u.pathname.match(/\/([^/]+)\/(?:dp|gp\/product)\//) || u.pathname.match(/\/([^/]*-[^/]*)\/?(?:p\/|$)/)
    if (!m) return ''
    return decodeURIComponent(m[1]).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  } catch { return '' }
}
const money = n => (n || n === 0) && !isNaN(n) ? '$' + Number(n).toFixed(Number(n) % 1 ? 2 : 0) : ''

function registry() {
  const n = names()
  const items = entries('registry')
  const need = items.filter(i => !i.data.got), got = items.filter(i => i.data.got)
  const shown = regFilter === 'need' ? need : regFilter === 'got' ? got : items
  const left = need.reduce((t, i) => t + (parseFloat(i.data.price) || 0) * (parseInt(i.data.qty) || 1), 0)
  const links = profile().registryLinks || []
  const e = editReg ? items.find(i => i.id === editReg) : null
  const d = e ? e.data : {}
  return `
    <section class="card">
      <h3>🎁 Our registry</h3>
      <p>${items.length} item${items.length === 1 ? '' : 's'} · <b>${need.length} still needed</b>${left ? ` · about ${money(left)} to go` : ''}</p>
      <div class="seg">${[['need', 'Still need'], ['got', 'Got it ✅'], ['all', 'All']].map(([id, l]) => `<button data-regf="${id}" class="${regFilter === id ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section>
    ${C.REG_CATS.map(([cat, label]) => {
      const list = shown.filter(i => (i.data.cat || 'other') === cat)
      if (!list.length) return ''
      return `<section class="card"><h3>${label}</h3>${list.map(i => {
        const it = i.data, by = i.author_role === 'mom' ? '🤰 ' + esc(n.mom) : '🧔 ' + esc(n.dad)
        return `<div class="reg ${it.got ? 'got' : ''}">
          <button class="tick" data-reg-got="${i.id}" aria-label="Got it">${it.got ? '✅' : '⬜'}</button>
          <div class="reg-main">
            <div class="reg-name">${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.name)}</a>` : esc(it.name)}${(parseInt(it.qty) || 1) > 1 ? ` <span class="fine">×${parseInt(it.qty)}</span>` : ''}</div>
            <div class="fine">${[it.url ? storeOf(it.url) : '', money(it.price), 'added by ' + by, it.got && it.gotBy ? 'got by ' + esc(nameOf(it.gotBy)) : ''].filter(Boolean).join(' · ')}</div>
            ${it.notes ? `<div class="fine reg-notes">${esc(it.notes)}</div>` : ''}
          </div>
          <div class="reg-act"><button class="mini" data-edit-reg="${i.id}">✏️</button>${i.author_role === me() ? `<button class="mini del" data-del="${i.id}">✕</button>` : ''}</div>
        </div>`
      }).join('')}</section>`
    }).join('')}
    ${!shown.length ? `<section class="card soft center"><p>${items.length ? 'Nothing here.' : 'Your list is empty. Add things below, or start with the basics.'}</p>${!items.length ? '<button class="big" data-act="reg-starter">Add a starter list (30 basics)</button>' : ''}</section>` : ''}
    <section class="card" id="regForm">
      <h3>${e ? 'Edit item' : 'Add an item'}</h3>
      <label class="field">Paste a link (Amazon, Target, anywhere), optional
        <input id="regUrl" type="url" inputmode="url" placeholder="https://www.amazon.com/…" value="${esc(d.url || '')}">
      </label>
      <label class="field">What is it?
        <input id="regName" placeholder="e.g. Infant car seat" value="${esc(d.name || '')}">
      </label>
      <div class="row2">
        <label class="field">Price <input id="regPrice" inputmode="decimal" placeholder="optional" value="${esc(d.price || '')}"></label>
        <label class="field">How many <input id="regQty" inputmode="numeric" value="${esc(d.qty || '1')}"></label>
      </div>
      <label class="field">Category
        <select id="regCat" class="inp">${C.REG_CATS.map(([id, l]) => `<option value="${id}" ${(d.cat || 'other') === id ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </label>
      <label class="field">Notes <input id="regNotes" placeholder="color, size, why we want it…" value="${esc(d.notes || '')}"></label>
      <button class="big primary" data-act="reg-save">${e ? 'Save changes' : 'Add to registry'}</button>
      ${e ? '<button class="ghost" data-act="reg-cancel">Cancel</button>' : ''}
    </section>
    <section class="card">
      <h3>🔗 Our store registries</h3>
      ${links.length ? links.map((l, i) => `<div class="mile"><a href="${esc(l.url)}" target="_blank" rel="noopener"><b>${esc(l.name)}</b></a><span><button class="mini del" data-reg-link-del="${i}">✕</button></span></div>`).join('') : '<p class="fine">Keep your Amazon, Target or Babylist registry links here so both of you can open them in one tap.</p>'}
      <div class="row2"><input id="linkName" placeholder="e.g. Amazon registry"><input id="linkUrl" type="url" placeholder="https://…"></div>
      <button class="ghost" data-act="reg-link-add">＋ Save registry link</button>
      <p class="fine">Tip: Amazon's Baby Registry lets you add your partner as a co-registrant, so you can both add straight from the Amazon app too.</p>
    </section>`
}

// ── Plan ────────────────────────────────────────────────────────────────────
function plan() {
  const g = gest()
  const p = profile()
  const lmp = g ? g.lmp : null
  const appts = entries('appointment').slice().sort((a, b) => a.data.date.localeCompare(b.data.date))
  return `
    <section class="card">
      <h3>Appointments</h3>
      ${appts.length ? appts.map(a => `<div class="mile ${a.data.date < isoDate(new Date()) ? 'past' : ''}"><b>📅 ${esc(a.data.title)}${a.data.notes ? `<span class="why">${esc(a.data.notes)}</span>` : ''}</b><span>${fmtDate(parseDate(a.data.date))}${a.data.time ? ' · ' + esc(fmtTime(a.data.time)) : ''} <button class="mini" data-edit-appt="${a.id}">✏️</button> ${a.author_role === me() ? `<button class="mini del" data-del="${a.id}">✕</button>` : ''}</span></div>`).join('') : '<p class="fine">Add the OB visits so you both see what\'s next.</p>'}
      ${apptForm()}
    </section>
    <section class="card">
      <h3>Milestones</h3>
      <div class="timeline">${C.MILESTONES.map(m => {
        const st = !g ? '' : g.week > m.week + 1 ? 'past' : g.week >= m.week ? 'now' : ''
        const when = lmp ? fmtDate(new Date(lmp.getTime() + m.week * 7 * DAY)) : ''
        return `<details class="tl ${st}"><summary><span class="w">Wk ${m.week}</span><b>${esc(m.title)}</b><span class="fine">${when}</span></summary><p>${esc(m.detail)}</p></details>`
      }).join('')}</div>
    </section>
    <section class="card">
      <h3>For the partner: this trimester</h3>
      <ul>${C.DAD_TRIMESTER[g ? g.tri : 1].map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    </section>
    <section class="card">
      <h3>🔔 Daily tips & alerts</h3>
      ${remindersCard()}
    </section>
    <section class="card">
      <h3>Pairing</h3>
      ${pairingCard(false)}
    </section>
    <section class="card">
      <h3>Settings</h3>
      <p>${g ? `Due: <b>${fmtDate(g.due)}</b> ${g.fromDoctor ? '(from your doctor)' : '(estimated from last period)'}` : 'Dates: <b>not set</b>'} · This phone: <b>${me() === 'mom' ? '🤰 ' + esc(names().mom) : '🧔 ' + esc(names().dad)}</b></p>
      <button class="ghost" data-act="edit-dates">Edit dates & names</button>
      <button class="ghost" data-act="switch-role">Switch role on this phone</button>
      <button class="ghost" data-act="export">Export backup</button>
      <label class="ghost file">Import backup<input type="file" id="importFile" accept="application/json" hidden></label>
      <button class="ghost danger" data-act="reset">Erase everything on this phone</button>
    </section>`
}

const fmtTime = t => { const [h, m] = t.split(':').map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) }
let editAppt = null
function apptForm() {
  const a = editAppt ? entries('appointment').find(e => e.id === editAppt) : null
  const d = a ? a.data : {}
  return `<h4>${a ? 'Edit appointment' : 'Add an appointment'}</h4>
    <input id="apptTitle" class="inp" placeholder="e.g. 8-week ultrasound" value="${esc(d.title || '')}">
    <div class="row2"><input id="apptDate" type="date" value="${esc(d.date || '')}"><input id="apptTime" type="time" value="${esc(d.time || '')}"></div>
    <input id="apptNotes" class="inp" placeholder="Notes (address, questions to ask…)" value="${esc(d.notes || '')}">
    <button class="big" data-act="add-appt">${a ? 'Save changes' : 'Add appointment'}</button>
    ${a ? '<button class="ghost" data-act="cancel-appt">Cancel</button>' : ''}`
}

// ── Events ──────────────────────────────────────────────────────────────────
function readDraftInputs() {
  if (!draft) return
  const note = $('#note'); if (note) draft.note = note.value
  const temp = $('#temp'); if (temp) draft.temp = temp.value
  const priv = $('#private'); if (priv) draft.private = priv.checked
}

app.addEventListener('click', async ev => {
  const b = ev.target.closest('button, [data-tab]')
  if (!b) return
  const d = b.dataset
  readDraftInputs()

  if (d.tab) { tab = d.tab; render(); scrollTo(0, 0); return }
  if (d.go) { tab = d.go; render(); scrollTo(0, 0); return }
  if (d.goLookup) { tab = 'lookup'; lookupTab = d.goLookup; render(); scrollTo(0, 0); return }
  if (d.role) { S.state.role = d.role; S.save(); onboardStep = 1; firstRun = true; render(); return }
  if (d.lt) { lookupTab = d.lt; render(); return }
  if (d.us) { usView = d.us; render(); return }
  if (d.quickmood) { draft = { kind: 'checkin', mood: +d.quickmood, energy: 0, symptoms: {}, temp: '', note: '' }; tab = 'checkin'; render(); scrollTo(0, 0); return }
  if (d.mood) { draft.mood = +d.mood; render(); return }
  if (d.energy) { draft.energy = draft.energy === +d.energy ? 0 : +d.energy; render(); return }
  if (d.stress) { draft.stress = +d.stress; render(); return }
  if (d.sym) {
    const l = ((draft.symptoms[d.sym] || 0) + 1) % 4
    if (l) draft.symptoms[d.sym] = l; else delete draft.symptoms[d.sym]
    const y = scrollY; render(); scrollTo(0, y); return
  }
  if (d.feel) {
    draft.feelings = draft.feelings.includes(d.feel) ? draft.feelings.filter(f => f !== d.feel) : [...draft.feelings, d.feel]
    const y = scrollY; render(); scrollTo(0, y); return
  }
  if (d.sendnote) { await S.addEntry('note', { text: d.sendnote }); notifyPartner('note', d.sendnote); toast('Sent 💌'); return }
  if (d.react) { await S.addEntry('reaction', { to: d.react, emoji: d.emoji }); toast('Sent ' + d.emoji); return }
  if (d.regf) { regFilter = d.regf; render(); return }
  if (d.regGot) {
    const it = entries('registry').find(x => x.id === d.regGot); if (!it) return
    S.updateEntry(it.id, it.data.got ? { got: false, gotBy: null } : { got: true, gotBy: me() })
    if (!it.data.got) toast('Marked as got ✅'); return
  }
  if (d.editReg) { editReg = d.editReg; render(); document.getElementById('regForm')?.scrollIntoView({ block: 'start' }); return }
  if (d.regLinkDel != null) { const l = (profile().registryLinks || []).slice(); l.splice(+d.regLinkDel, 1); await S.addEntry('profile', { registryLinks: l }); return }
  if (d.remDel != null) { const list = reminders().slice(); list.splice(+d.remDel, 1); setReminders(list); remindersChanged(); return }
  if (d.editAppt) { editAppt = d.editAppt; render(); document.getElementById('apptTitle')?.scrollIntoView({ block: 'center' }); return }
  if (d.editCi) {
    const e = entries('checkin').find(x => x.id === d.editCi); if (!e) return
    draft = { kind: 'checkin', editing: e.id, mood: e.data.mood || 0, energy: e.data.energy || 0, symptoms: { ...(e.data.symptoms || {}) }, temp: e.data.temp || '', note: e.data.note || '' }
    tab = 'checkin'; render(); scrollTo(0, 0); return
  }
  if (d.del) { if (confirm('Delete this?')) S.removeEntry(d.del); return }

  switch (d.act) {
    case 'save-dates': {
      const due = $('#due').value, lmp = due ? '' : $('#lmp').value
      if (!due && !lmp) return toast('Add the due date (or the first day of the last period)')
      const data = { due, lmp, momName: $('#momName').value.trim(), dadName: $('#dadName').value.trim(), obPhone: $('#obPhone').value.trim() }
      S.state.prefs = { ...S.state.prefs, ...data }
      await S.addEntry('profile', data)
      onboardStep = firstRun && !S.isPaired() && S.syncAvailable() ? 2 : 0
      firstRun = false
      render(); return
    }
    case 'finish-onboard': onboardStep = 0; render(); return
    case 'skip-dates':
      onboardStep = firstRun && !S.isPaired() && S.syncAvailable() ? 2 : 0
      firstRun = false; render(); scrollTo(0, 0); return
    case 'to-pair': onboardStep = 2; render(); return
    case 'edit-dates': onboardStep = 1; render(); scrollTo(0, 0); return
    case 'switch-role': S.state.role = other(); S.save(); draft = null; render(); toast('This phone is now ' + nameOf(me())); return
    case 'save-checkin': {
      if (!draft.mood) return
      const ciData = { mood: draft.mood, energy: draft.energy || null, symptoms: draft.symptoms, temp: draft.temp.trim(), note: draft.note.trim() }
      if (draft.editing) {
        S.updateEntry(draft.editing, ciData)
        draft = null; tab = 'today'; render(); scrollTo(0, 0); toast('Check-in updated'); return
      }
      const saved = await S.addEntry('checkin', ciData)
      draft = null; tab = 'today'; render(); scrollTo(0, 0)
      notifyPartner('checkin', '', nudgeFor(saved))
      toast(S.isPaired() ? 'Shared with ' + names().dad : 'Saved'); return
    }
    case 'save-dadcheck': {
      if (!draft.stress) return
      await S.addEntry('dadcheck', { stress: draft.stress, feelings: draft.feelings, note: draft.note.trim() }, { local: draft.private })
      const priv = draft.private
      draft = null; render(); toast(priv ? 'Saved privately 🔒' : 'Saved'); return
    }
    case 'send-msg': {
      const t = $('#msg').value.trim(); if (!t) return
      await S.addEntry('note', { text: t }); notifyPartner('note', t); toast('Sent 💌'); return
    }
    case 'add-appt': {
      const title = $('#apptTitle').value.trim(), date = $('#apptDate').value
      if (!title || !date) return toast('Add a title and a date')
      const appt = { title, date, time: $('#apptTime').value, notes: $('#apptNotes').value.trim() }
      if (editAppt) { S.updateEntry(editAppt, appt); editAppt = null; toast('Appointment updated') } else { await S.addEntry('appointment', appt); toast('Added 📅') }
      return
    }
    case 'cancel-appt': editAppt = null; render(); return
    case 'cancel-edit': draft = null; render(); return
    case 'add-symptom': {
      const label = (prompt('Name the symptom (e.g. "Metallic taste")') || '').trim().slice(0, 40)
      if (!label) return
      const list = profile().customSymptoms || []
      if (list.some(c => c.label.toLowerCase() === label.toLowerCase())) return toast('Already on the list')
      const id = 'c_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20) + '_' + Math.random().toString(36).slice(2, 6)
      await S.addEntry('profile', { customSymptoms: [...list, { id, label }] })
      if (draft) draft.symptoms[id] = 1
      render(); toast('Added "' + label + '"'); return
    }
    case 'create-couple':
      b.disabled = true; b.textContent = 'Creating…'
      try { await S.createCouple(); render() } catch (e) { toast(e.message || 'Could not create'); render() }
      return
    case 'join-couple': {
      const code = $('#joinCode').value
      if (code.replace(/[^a-z0-9]/gi, '').length !== 8) return toast('Codes are 8 characters')
      b.disabled = true; b.textContent = 'Joining…'
      try { await S.joinCouple(code); toast('Paired! 🎉'); render() } catch (e) { toast(e.message || 'Could not join'); render() }
      return
    }
    case 'share-code': {
      const text = `Join me on Together, our pregnancy app. Code: ${S.state.code}\n${location.href.split('#')[0]}`
      if (navigator.share) navigator.share({ text }).catch(() => {})
      else { navigator.clipboard?.writeText(text); toast('Copied') }
      return
    }
    case 'reg-save': {
      const url = $('#regUrl').value.trim(), name = ($('#regName').value.trim() || nameFromUrl(url)).slice(0, 120)
      if (!name) return toast('Give it a name')
      if (url && !/^https?:\/\//i.test(url)) return toast('Links need to start with https://')
      const item = { name, url, price: $('#regPrice').value.replace(/[^0-9.]/g, ''), qty: String(parseInt($('#regQty').value) || 1), cat: $('#regCat').value, notes: $('#regNotes').value.trim() }
      if (editReg) { S.updateEntry(editReg, item); editReg = null; toast('Saved'); return }
      await S.addEntry('registry', { ...item, got: false })
      notifyPartner('registry', '', { title: `🎁 ${nameOf(me())} added to the registry`, body: name })
      toast('Added 🎁'); return
    }
    case 'reg-cancel': editReg = null; render(); return
    case 'reg-starter': {
      for (const [cat, name, notes] of C.REG_STARTER) await S.addEntry('registry', { name, url: '', price: '', qty: '1', cat, notes, got: false })
      toast('Starter list added. Edit or delete anything.'); return
    }
    case 'reg-link-add': {
      const name = $('#linkName').value.trim() || 'Registry', url = $('#linkUrl').value.trim()
      if (!/^https?:\/\//i.test(url)) return toast('Paste the full link, starting with https://')
      await S.addEntry('profile', { registryLinks: [...(profile().registryLinks || []), { name, url }] }); toast('Link saved'); return
    }
    case 'rem-add': {
      const list = reminders(), last = list[list.length - 1]
      const h = last ? Math.min(23, +last.time.slice(0, 2) + 2) : 9
      setReminders([...list, { time: String(h).padStart(2, '0') + ':00', kind: me() === 'mom' ? 'checkin' : 'tip' }]); remindersChanged(); return
    }
    case 'push-on':
      b.disabled = true; b.textContent = 'Turning on…'
      try { await enablePush(); toast('Reminders are on 🔔') } catch (e) { console.warn(e); toast('Couldn\'t turn on: ' + (e.message || 'try again')) }
      render(); return
    case 'push-test':
      try { const r = await S.push('test'); toast(r && r.sent ? 'Sent. It should pop up in a few seconds.' : 'Nothing sent. Try turning it off and on again.') } catch (e) { toast('Test failed: ' + (e.message || 'check your signal')) }
      return
    case 'push-off': {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) { await S.push('unsubscribe', { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe() }
      } catch (e) { console.warn(e) }
      S.state.prefs = { ...S.state.prefs, push: { ...pushPrefs(), on: false } }; S.save()
      render(); toast('Reminders off'); return
    }
    case 'copy-link':
      navigator.clipboard?.writeText(personalLink()).then(() => toast('Link copied. Keep it somewhere safe.'), () => toast(personalLink()))
      return
    case 'unpair': if (confirm('Unpair this phone? Entries already here stay on this phone.')) { S.unpair(); history.replaceState(null, '', location.pathname); render() } return
    case 'export': {
      const blob = new Blob([JSON.stringify({ app: 'together', v: 1, exported: new Date().toISOString(), entries: S.state.entries, prefs: S.state.prefs }, null, 2)], { type: 'application/json' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `together-backup-${isoDate(new Date())}.json`; a.click()
      return
    }
    case 'reset':
      if (confirm('Erase all Together data on this phone? This can\'t be undone.')) { S.resetAll(); location.reload() }
      return
  }
})

app.addEventListener('input', ev => {
  if (ev.target.id === 'q') {
    lookupQuery = ev.target.value
    const pos = ev.target.selectionStart
    render()
    const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos)
  }
  if (ev.target.id === 'note' || ev.target.id === 'temp') readDraftInputs()
  if (ev.target.id === 'regUrl') { const nm = $('#regName'); if (nm && !nm.value) nm.value = nameFromUrl(ev.target.value) }
})

app.addEventListener('change', async ev => {
  const t = ev.target
  if (t.dataset.remTime != null || t.dataset.remKind != null) {
    const list = reminders().slice(), k = +(t.dataset.remTime ?? t.dataset.remKind)
    if (t.dataset.remTime != null && t.value) list[k] = { ...list[k], time: t.value }
    if (t.dataset.remKind != null) list[k] = { ...list[k], kind: t.value }
    setReminders(list); remindersChanged(); return
  }
  if (ev.target.id === 'private') readDraftInputs()
  if (ev.target.id === 'importFile') {
    const f = ev.target.files[0]; if (!f) return
    try {
      const data = JSON.parse(await f.text())
      if (data.app !== 'together' || !Array.isArray(data.entries)) throw new Error('Not a Together backup')
      const have = new Set(S.state.entries.map(e => e.id))
      const fresh = data.entries.filter(e => e && e.id && e.kind && e.created_at && !have.has(e.id)).map(e => ({ ...e, synced: false }))
      S.state.entries = [...S.state.entries, ...fresh].sort((a, b) => a.created_at.localeCompare(b.created_at))
      S.state.prefs = { ...data.prefs, ...S.state.prefs }
      if (S.isPaired()) fresh.filter(e => !e.local).forEach(e => S.state.outbox.push(e.id))
      S.save(); S.flush(); render(); toast(`Imported ${fresh.length} entries`)
    } catch (e) { toast(e.message) }
  }
})

S.onChange(evt => {
  if (evt.type === 'remote' && evt.added?.length) {
    const e = evt.added.at(-1)
    const who = nameOf(e.author_role)
    const msg = e.kind === 'checkin' ? (me() === 'dad' && e.author_role === 'mom' ? `${nudgeFor(e).title}. ${nudgeFor(e).body}` : `${who} just checked in`) : e.kind === 'note' ? `💌 ${who}: ${e.data.text}` : e.kind === 'reaction' ? `${who} sent ${e.data.emoji}` : e.kind === 'appointment' ? `${who} added ${e.data.title}` : e.kind === 'registry' ? `🎁 ${who} added ${e.data.name} to the registry` : ''
    if (msg) { toast(msg); navigator.vibrate?.(60) }
  }
  // don't yank the page out from under someone mid-typing
  const a = document.activeElement
  if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type !== 'checkbox'))) return
  const y = scrollY; render(); scrollTo(0, y)
})

// refresh "today" when the phone is picked up the next morning
document.addEventListener('visibilitychange', () => { if (!document.hidden) render() })

async function boot() {
  const code = params.get('c'), role = params.get('r')
  if (!S.state.coupleId && code && (role === 'mom' || role === 'dad') && S.syncAvailable()) {
    S.state.role = S.state.role || role
    S.save()
    autoJoining = true
    render()
    try { await S.joinCouple(code) } catch (e) { console.warn(e); toast('Couldn\'t reconnect. Check your signal and reopen the app.') }
    autoJoining = false
    onboardStep = 0
    render()
    S.start()
    return
  }
  render()
  S.start()
}
boot()

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {})
