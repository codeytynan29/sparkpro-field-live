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
// Links typed on the other phone (or by anyone with the code) only ever open
// as web pages, never as javascript: or other schemes.
const safeUrl = u => /^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : ''
const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0 }
const DAY = 86400000

let tab = 'today'
let lookupTab = 'foods'
let lookupQuery = ''
let planView = 'calendar' // 'calendar' | 'registry' | 'settings' inside the Plan tab
let histWho = 'both', histDays = 14
let usView = null // 'her' | 'him' | 'feed'; defaults to the partner's side
let draft = null // in-progress check-in, survives re-renders
let onboardStep = 0
let firstRun = false
let toastTimer = null

// ── Dates ───────────────────────────────────────────────────────────────────
const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
// Calendar-day math (a day across a daylight-saving change is 23 or 25 hours)
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const dayDiff = (a, b) => Math.round((a - b) / DAY)
const fmtDate = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const fmtWhen = iso => {
  const d = new Date(iso), days = Math.round((today0() - new Date(d).setHours(0, 0, 0, 0)) / DAY)
  const t = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return days === 0 ? `Today ${t}` : days === 1 ? `Yesterday ${t}` : `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ${t}`
}
const sameDay = (iso, d = new Date()) => new Date(iso).toDateString() === d.toDateString()

// Latest shared profile entry wins, so if either person corrects the LMP the
// other phone follows. Blank fields never erase what the other phone filled in.
function profile() {
  const p = { ...(S.state.prefs || {}) }
  for (const e of S.state.entries) if (e.kind === 'profile') for (const [k, v] of Object.entries(e.data || {})) if (v !== '' && v != null) p[k] = v
  return p
}

function gest() {
  const p = profile()
  // The OB's due date wins when there is one; otherwise estimate from the LMP.
  if (!p.due && !p.lmp) return null
  const due = p.due ? parseDate(p.due) : addDays(parseDate(p.lmp), 280)
  const lmp = addDays(due, -280)
  const days = dayDiff(today0(), lmp)
  const week = Math.floor(days / 7), day = ((days % 7) + 7) % 7
  const tri = week < 14 ? 1 : week < 28 ? 2 : 3
  return { days, week, day, due, lmp, fromDoctor: !!p.due, tri, left: dayDiff(due, today0()), pct: Math.min(100, Math.max(0, days / 280 * 100)) }
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
    ? [{ time: '08:00', kind: 'tip' }, { time: '09:30', kind: 'checkin' }, { time: '14:00', kind: 'checkin' }, { time: '19:30', kind: 'tip' }]
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

function notifyPartner(kind, text, msg, entryId) {
  if (S.isPaired()) S.push('notify-partner', { kind, text, name: nameOf(me()), title: msg?.title, body: msg?.body, entry_id: entryId }).catch(e => console.warn('notify failed (the server will retry)', e))
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
  u.search = S.state.code ? `?c=${S.state.code}` : ''
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
  try { window.history.replaceState(null, '', link) } catch (e) { console.warn('could not update address', e) }
}

// Typed-but-unsaved values, keyed by input id. Every render puts them back, so
// a live update from the other phone never wipes a half-filled form.
const FORM_IDS = ['regUrl', 'regName', 'regPrice', 'regQty', 'regCat', 'regNotes', 'regStars', 'regReviews', 'apptTitle', 'apptDate', 'apptTime', 'apptNotes', 'msg', 'linkName', 'linkUrl', 'joinCode']
const formState = {}
const clearForm = prefix => { for (const k of Object.keys(formState)) if (k.startsWith(prefix)) delete formState[k] }
function restoreForms(focusId, sel) {
  for (const [id, v] of Object.entries(formState)) { const el = document.getElementById(id); if (el && el.value !== v) el.value = v }
  const f = focusId && document.getElementById(focusId)
  if (f) { f.focus({ preventScroll: true }); try { if (sel != null) f.setSelectionRange(sel, sel) } catch {} }
}

// Any crash while drawing a screen shows what went wrong and a way out,
// instead of leaving a blank page.
function render() {
  const a = document.activeElement, focusId = a && a.id && app.contains(a) ? a.id : null
  let sel = null; try { sel = a && a.selectionStart } catch {}
  try { renderScreen(); restoreForms(focusId, sel) } catch (e) {
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
    app.innerHTML = `<div class="onb"><div class="hero">🤍</div><h2 class="center">Connecting to your couple…</h2><p class="lead center">One moment.</p></div>`
    return
  }
  if (!S.state.role || onboardStep) { app.innerHTML = onboarding(); return }
  const g = gest()
  const sync = { local: '', live: '<span class="dot live"></span>Live', connecting: '<span class="dot"></span>Connecting', offline: `<span class="dot off"></span>Offline${S.pendingCount() ? ` · ${S.pendingCount()} waiting` : ' — will sync'}`, unpaired: '<span class="dot off"></span>Not paired', removed: '<span class="dot off"></span>Disconnected' }[S.status]
  app.innerHTML = `
    <header class="top">
      <div>
        <div class="brand">Together</div>
        <div class="sub">${g && g.week >= 0 ? `Week ${g.week} + ${g.day} · ${['', '1st', '2nd', '3rd'][g.tri]} trimester` : 'Dates not set yet'}</div>
      </div>
      <button class="sync" data-go="plan" data-pv="settings">${sync}</button>
    </header>
    <main>${({ today, checkin, timeline, lookup, plan })[tab]()}</main>
    <nav class="tabs">
      ${[['today', '🏡', 'Today'], ['checkin', '✍️', me() === 'mom' ? 'Check in' : 'You'], ['timeline', '💞', 'Us'], ['lookup', '🔎', 'Is it safe?'], ['plan', '🗓️', 'Plan']]
        .map(([id, i, l]) => `<button data-tab="${id}" class="${tab === id ? 'on' : ''}"><span>${i}${id === 'checkin' && !checkedInToday() ? '<i class="badge" aria-label="not checked in today"></i>' : ''}</span>${l}</button>`).join('')}
    </nav>`
  if (tab === 'checkin' && me() === 'dad') bindBreath()
}

// ask({ title, text, ok, danger, input, placeholder }) → resolves true / the typed
// text, or null if cancelled. Replaces the browser's confirm() and prompt().
function ask({ title, text = '', ok = 'OK', cancel = 'Cancel', danger = false, input = false, placeholder = '' }) {
  return new Promise(resolve => {
    const d = document.createElement('dialog')
    d.className = 'sheet'
    d.innerHTML = `<h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}${input ? `<input class="inp" maxlength="40" placeholder="${esc(placeholder)}">` : ''}
      <div class="sheet-row"><button class="big" data-r="0">${esc(cancel)}</button><button class="big ${danger ? 'danger-btn' : 'primary'}" data-r="1">${esc(ok)}</button></div>`
    document.body.append(d)
    const done = v => { d.close(); d.remove(); resolve(v) }
    d.addEventListener('click', e => {
      const b = e.target.closest('[data-r]')
      if (!b) { if (e.target === d) done(null); return }
      if (b.dataset.r === '0') return done(null)
      if (input) { const v = d.querySelector('input').value.trim(); if (!v) return d.querySelector('input').focus(); return done(v) }
      done(true)
    })
    d.addEventListener('cancel', e => { e.preventDefault(); done(null) })
    d.showModal()
    if (input) d.querySelector('input').focus()
  })
}

// "Deleted · Undo" instead of an are-you-sure box
function undoToast(msg, onUndo) {
  let t = $('#toast')
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t) }
  t.innerHTML = `${esc(msg)} <button class="undo">Undo</button>`
  t.className = 'show has-undo'
  t.querySelector('.undo').onclick = () => { onUndo(); t.className = ''; render() }
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = '' }, 5500)
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
      <p class="fine">${esc(C.DISCLAIMER_SHORT)}</p>
    </div>`
  }
  if (onboardStep === 2) {
    const mom = me() === 'mom'
    const partner = mom ? 'your partner' : 'her', subject = mom ? 'your partner' : 'she', their = mom ? 'their' : 'her'
    if (S.isPaired()) return `<div class="onb">
      <div class="hero">🔗</div>
      <h2 class="center">Now invite ${partner}</h2>
      <p class="lead center">Send this link. Opening it on ${their} phone connects you both. No codes to type.</p>
      <button class="big primary" data-act="share-code">Send the invite link</button>
      <p class="fine center">Or they can tap "Join with a code" and enter <b>${esc(S.state.code.replace(/(.{4})(.{4})/, '$1-$2'))}</b>.</p>
      <button class="big" data-act="after-connect">Continue</button>
    </div>`
    return `<div class="onb">
      <h2>Connect with ${partner}</h2>
      <p class="lead">Pair once and every check-in, note and appointment shows up on both phones as it happens.</p>
      <button class="big primary" data-act="create-couple">I'm first: set us up</button>
      <p class="or">— or, if ${subject} already started —</p>
      <label class="field">Enter the code from ${their} phone
        <input id="joinCode" placeholder="ABCD-2345" autocapitalize="characters" autocomplete="off">
      </label>
      <button class="big" data-act="join-couple">Join</button>
      <button class="ghost center" data-act="after-connect">Skip, just this phone for now</button>
    </div>`
  }
  if (onboardStep === 3) {
    const needsIcon = isIOS && !standalone()
    return `<div class="onb">
      <div class="hero">🎉</div>
      <h2 class="center">You're all set</h2>
      ${needsIcon ? `<section class="card"><h3>📲 One more step: add it to your home screen</h3>
        <ol class="plan"><li>Tap the <b>Share</b> button in Safari (the square with an arrow).</li><li>Tap <b>Add to Home Screen</b>.</li><li>From now on, open Together from that icon. It remembers your pairing, and notifications only work from the icon.</li></ol></section>` : ''}
      <section class="card soft"><p>Next: turn on reminders and partner alerts in <b>Plan → Settings</b>.</p></section>
      <button class="big primary" data-act="finish-onboard">Start</button>
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
      <p class="fine">Your personal link and code work like a key to your shared space. Don't post them anywhere public.</p>
      ${inOnboarding ? '' : '<button class="ghost danger" data-act="unpair">Unpair this phone</button>'}
    </div>
    ${inOnboarding ? '' : devicesCard()}`
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

// Every phone (and browser) that has joined your couple. iPhones count Safari,
// the home-screen icon and in-app browsers separately, so a few per person is normal.
let devices = null, devicesLoading = false
function loadDevices() {
  if (devicesLoading || devices) return
  devicesLoading = true
  S.push('devices').then(r => { devices = r.devices || [] }, () => { devices = 'error' })
    .finally(() => { devicesLoading = false; if (tab === 'plan' && planView === 'settings') render() })
}
function devicesCard() {
  loadDevices()
  const n = names()
  const ago = iso => { const d = dayDiff(today0(), new Date(new Date(iso).setHours(0, 0, 0, 0))); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago` }
  const list = Array.isArray(devices) ? devices : []
  return `<div class="card soft">
    <h4>📱 Connected devices</h4>
    ${devices === 'error' ? '<p class="fine">Couldn\'t load the list. Check your signal.</p>' : !devices ? '<p class="fine">Loading…</p>'
      : list.map(d => `<div class="mile"><b>${d.role === 'mom' ? '🤰 ' + esc(n.mom) : '🧔 ' + esc(n.dad)}${d.me ? ' · this phone' : ''}<span class="why">Last opened ${ago(d.last_seen || d.joined_at)} · joined ${esc(fmtDate(new Date(d.joined_at)))}</span></b>${d.me ? '' : `<span><button class="mini del" data-rm-dev="${esc(d.user_id)}" aria-label="Remove device">Remove</button></span>`}</div>`).join('')}
    <p class="fine">A few per person is normal: Safari and the home-screen icon count separately. Don't recognize one? Remove it, then tap <b>Change couple code</b> so old links stop working.</p>
    <button class="ghost" data-act="rotate-code">Change couple code</button>
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
  const appts = entries('appointment').filter(a => a.data.date && a.data.date >= isoDate(new Date())).sort((a, b) => a.data.date.localeCompare(b.data.date)).slice(0, 2)
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
    // (when she hasn't checked in, the mood prompt sits at the very top: see myCheckinStatus)
    main = herToday ? `${checkinCard(herToday, 'Your check-in today')}` : ''
    const dadCI = entries('dadcheck', 'dad').filter(e => !e.local).at(-1)
    if (dadCI && sameDay(dadCI.created_at)) main += `<section class="card soft"><p>${esc(n.dad)} checked in too: <b>${dadCI.data.feelings?.map(f => C.DAD_FEELINGS.find(x => x.id === f)?.label).filter(Boolean).join(', ') || 'stress ' + num(dadCI.data.stress, 1, 5) + '/5'}</b></p></section>`
  }

  return `
    ${myCheckinStatus()}
    ${morningCard()}
    ${flags.length ? `<section class="card alert"><h3>⚠️ Worth a call</h3>${flags.map(f => `<p>${esc(f.text)}</p>`).join('')}${profile().obPhone ? `<a class="btn" href="tel:${esc(profile().obPhone.replace(/[^0-9+]/g, ''))}">📞 Call OB</a>` : ''} <button class="ghost" data-go-lookup="redflags">When to call</button></section>` : ''}
    ${g ? babyCard(g, wk, fe, fruit, len) : datesCard()}
    ${main}
    ${S.isPaired() && !pushPrefs().on && pushSupported() ? `<section class="card soft"><p>🔔 Want a daily tip, and a heads-up when ${esc(nameOf(other()))} ${me() === 'dad' ? 'checks in' : 'sends a note'}?</p><button class="ghost" data-go="plan" data-pv="settings">Set up notifications</button></section>` : ''}
    ${lastNote ? `<section class="card note"><div class="from">💌 ${esc(nameOf(other()))} · ${fmtWhen(lastNote.created_at)}</div><p>${esc(lastNote.data.text)}</p></section>` : ''}
    <section class="card">
      <h3>Send ${esc(nameOf(other()))} a little something</h3>
      <div class="chips">${(me() === 'dad' ? ['Thinking of you ❤️', 'Need anything? I\'ll grab it', 'Proud of you', 'Rest — I\'ve got tonight'] : ['Thank you ❤️', 'Rough one, could use a hug', 'Feeling good today!', 'Can you grab me a snack?'])
        .map(t => `<button class="chip" data-sendnote="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    </section>
    <section class="card quote"><p>“${esc(enc)}”</p></section>
    ${upcoming.length || appts.length ? `<section class="card"><h3>Coming up</h3>
      ${appts.map(a => `<div class="mile"><b>📅 ${esc(a.data.title)}</b><span>${fmtDate(parseDate(a.data.date))}</span></div>`).join('')}
      ${upcoming.map(m => `<div class="mile"><b>${esc(m.title)}</b><span>Week ${m.week}${m.week > g.week ? ` · ~${fmtDate(addDays(g.lmp, m.week * 7))}` : ' · now'}</span></div>`).join('')}
    </section>` : ''}`
}

// This phone's own check-in today, always the first thing on Today: a big
// "check in" prompt until it's done, then a clear "done" line with the time.
const myCheckinsToday = () => entries(me() === 'mom' ? 'checkin' : 'dadcheck', me()).filter(e => sameDay(e.created_at))
const checkedInToday = () => myCheckinsToday().length > 0
function myCheckinStatus() {
  const n = names(), mine = myCheckinsToday(), last = mine.at(-1)
  if (last) {
    const t = new Date(last.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const waiting = S.isPaired() && !last.local && !last.synced
    const what = me() === 'mom' ? (C.MOOD.find(m => m.v === last.data.mood)?.label || '') : `stress ${num(last.data.stress, 1, 5)}/5`
    return `<section class="card done-card"><span class="done-tick">✅</span><div><b>You checked in today</b> · ${t}${what ? ` · ${esc(what)}` : ''}${mine.length > 1 ? ` · ${mine.length} times` : ''}
      <div class="fine">${last.local ? '🔒 Private, on this phone only' : waiting ? '⏳ Saved on this phone, sending when you have signal' : S.isPaired() ? `${esc(nameOf(other()))} can see it` : 'Saved'}</div></div>
      <button class="mini" data-tab="checkin">${me() === 'mom' ? 'Add more' : 'Again'}</button></section>`
  }
  if (me() === 'mom') return `<section class="card prompt cta">
      <h3>How are you feeling today, ${esc(n.mom === 'Mom' ? 'mama' : n.mom)}?</h3>
      <div class="moods">${C.MOOD.map(m => `<button data-quickmood="${m.v}"><span>${m.emoji}</span>${m.label}</button>`).join('')}</div>
      <p class="fine">You haven't checked in today. Tap one to start. ${S.isPaired() ? esc(n.dad) + ' sees it right away.' : ''}</p>
    </section>`
  return `<section class="card prompt cta">
      <h3>✍️ You haven't checked in today</h3>
      <p>20 seconds: your stress and what's on your mind.${S.isPaired() ? ` ${esc(n.mom)} sees it unless you mark it private.` : ''}</p>
      <button class="big primary" data-tab="checkin">Check in now</button>
    </section>`
}

// First open of the day: a short tip at the top of Today, until tapped away.
// His is built from her latest check-in when there's a recent one.
function morningCard() {
  const day = isoDate(new Date())
  if ((S.state.prefs || {}).morningSeen === day) return ''
  const h = new Date().getHours()
  const hello = h < 12 ? '☀️ Good morning' : h < 17 ? '👋 Good afternoon' : '🌙 Good evening'
  let tip = pick(me() === 'mom' ? C.MORNING_MOM : C.MORNING_DAD, dayIndex()), why = ''
  if (me() === 'dad') {
    const ci = latest('checkin', 'mom')
    const step = ci && Date.now() - new Date(ci.created_at) < 30 * 3600e3 ? gamePlan(ci)[0] : null
    if (step) { tip = step.t; why = `From ${esc(names().mom)}'s last check-in (${esc(step.why)})` }
  }
  return `<section class="card morning">
    <h3>${hello}, ${esc(nameOf(me()))}</h3>
    <p>${esc(tip)}</p>${why ? `<p class="fine">${why}</p>` : ''}
    <button class="ghost" data-act="morning-ok">Got it 👍</button>
  </section>`
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
    ${syms.length ? `<div class="chips">${syms.map(([id, l]) => { const s = symptom(id); l = num(l, 1, 3) | 0; return s ? `<span class="chip on l${l}">${s.emoji} ${esc(s.label)} · ${lvl[l]}</span>` : '' }).join('')}</div>` : ''}
    ${d.note ? `<p class="quote-inline">“${esc(d.note)}”</p>` : ''}
    <div class="react">
      ${hearts.length ? `<span>${hearts.map(h => esc(h.data.emoji)).join('')} from ${esc(nameOf(hearts[0].author_role))}</span>` : ''}
      ${ci.author_role !== me() ? ['❤️', '🤗', '💪'].map(e => `<button class="mini" data-react="${ci.id}" data-emoji="${e}">${e}</button>`).join('') : `<button class="mini" data-edit-ci="${ci.id}">✏️ Edit</button>`}
    </div>
  </section>`
}

// ── Check-in ────────────────────────────────────────────────────────────────
function checkin() { return me() === 'mom' ? momCheckin() : dadCheckin() }

// A check-in loaded back into the form (values cleaned, in case it came from another phone)
function editDraft(e) {
  const symptoms = {}
  for (const [id, l] of Object.entries(e.data.symptoms || {})) { const v = num(l, 0, 3) | 0; if (v) symptoms[id] = v }
  return { kind: 'checkin', editing: e.id, mood: num(e.data.mood, 0, 5) | 0, energy: num(e.data.energy, 0, 5) | 0, symptoms, temp: String(e.data.temp || ''), note: String(e.data.note || '') }
}

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
        const s = symptom(id); if (!s) return ''
        const flag = s.flag && s.flagAt && l >= s.flagAt
        return `<div class="ex ${flag ? 'warn' : ''}"><b>${s.emoji} ${esc(s.label)}</b><p>${esc(s.meaning)}</p>${s.flag ? `<p class="flag">${flag ? '⚠️ ' : 'Call if: '}${esc(s.flag)}</p>` : ''}</div>`
      }).join('')}<p class="fine">${esc(C.DISCLAIMER_SHORT)}</p></div>` : ''}
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
    ${recentList('checkin', 'mom')}`
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
    ${recentList('dadcheck', 'dad')}`
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

function recentList(kind, role) {
  const list = entries(kind, role).slice(-7).reverse()
  if (!list.length) return ''
  if (kind === 'checkin') {
    return `<section class="card"><h3>Last 7 check-ins</h3><div class="spark">${list.slice().reverse().map(e => `<div title="${fmtWhen(e.created_at)}"><i style="height:${(e.data.mood || 0) * 20}%"></i><span>${C.MOOD.find(m => m.v === e.data.mood)?.emoji || ''}</span></div>`).join('')}</div></section>`
  }
  return `<section class="card"><h3>Recent</h3>${list.map(e => `<div class="mile"><b>Stress ${num(e.data.stress, 1, 5)}/5 ${e.local ? '🔒' : ''}</b><span>${fmtWhen(e.created_at)}</span></div>`).join('')}</section>`
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
    const top = e && label ? label(e) : ''
    return `<div title="${fmtDate(d)}"><b class="bar-top">${esc(top)}</b><i style="height:${v ? Math.max(8, v / max * 100) : 0}%"></i><span class="fine">${shortDay(d)}</span></div>`
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
  // Today's check-ins up top, fresh every morning. History lives further down.
  const herAll = entries('checkin', 'mom'), hisAll = entries('dadcheck', 'dad').filter(e => !(e.local && me() !== 'dad'))
  const herToday = herAll.filter(e => sameDay(e.created_at)), hisToday = hisAll.filter(e => sameDay(e.created_at))
  const herCI = herToday.at(-1), hisCI = hisToday.at(-1)
  const moodOf = e => C.MOOD.find(m => m.v === e?.data?.mood)
  const hisFeel = e => (e?.data?.feelings || []).map(id => C.DAD_FEELINGS.find(f => f.id === id)).filter(Boolean)
  const topSyms = e => Object.entries(e.data.symptoms || {}).sort((a, b) => b[1] - a[1]).map(([id]) => symptom(id)).filter(Boolean)
  const time = e => new Date(e.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const count = list => list.length > 1 ? ` · ${list.length} today` : ''
  const lastSeen = list => list.length ? `Last: ${esc(fmtWhen(list.at(-1).created_at))}` : 'No check-ins yet'
  const mineMissing = me() === 'mom' ? !herCI : !hisToday.some(e => e.author_role === 'dad')
  const strip = `<div class="today-head"><h3>Today</h3><span class="fine">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span></div>
  <div class="duo">
    <button class="duo-card ${usView === 'her' ? 'on' : ''}" data-us="her">
      <div class="fine">🤰 ${esc(n.mom)}</div>
      ${herCI ? `<div class="big-emoji">${moodOf(herCI)?.emoji || '•'}</div><div>${esc(moodOf(herCI)?.label || 'Checked in')}</div>
        ${topSyms(herCI).length ? `<div class="fine">${topSyms(herCI).slice(0, 2).map(s => esc(s.label)).join(', ')}${topSyms(herCI).length > 2 ? ` +${topSyms(herCI).length - 2}` : ''}</div>` : ''}
        <div class="fine">${time(herCI)}${count(herToday)}</div>`
      : `<div class="big-emoji">–</div><div>Not yet today</div><div class="fine">${lastSeen(herAll)}</div>`}
    </button>
    <button class="duo-card ${usView === 'him' ? 'on' : ''}" data-us="him">
      <div class="fine">🧔 ${esc(n.dad)}</div>
      ${hisCI ? `<div class="big-emoji">${hisFeel(hisCI)[0]?.emoji || '🙂'}</div><div>Stress ${num(hisCI.data.stress, 1, 5)}/5</div>
        ${hisFeel(hisCI).length ? `<div class="fine">${hisFeel(hisCI).slice(0, 2).map(f => esc(f.label)).join(', ')}</div>` : ''}
        <div class="fine">${time(hisCI)}${count(hisToday)}</div>`
      : `<div class="big-emoji">–</div><div>Not yet today</div><div class="fine">${lastSeen(hisAll)}</div>`}
    </button>
  </div>
  ${mineMissing ? `<button class="ghost today-cta" data-tab="checkin">✍️ Add your check-in for today</button>` : ''}
  <div class="seg">${[['her', `${esc(n.mom)}'s side`], ['him', `${esc(n.dad)}'s side`], ['history', 'History'], ['feed', 'Notes']].map(([id, l]) => `<button data-us="${id}" class="${usView === id ? 'on' : ''}">${l}</button>`).join('')}</div>`
  return strip + (usView === 'her' ? herSide() : usView === 'him' ? hisSide() : usView === 'history' ? historyView() : feed())
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
      <details><summary>What these mean</summary>${common.map(([id]) => symptom(id)).filter(Boolean).map(s => `<p><b>${s.emoji} ${esc(s.label)}:</b> ${esc(s.meaning)}</p>`).join('')}<p class="fine">${esc(C.DISCLAIMER_SHORT)}</p></details></section>` : ''}
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
      <div class="ci-stats"><div><span>🌡️</span>Stress ${num(ci.data.stress, 1, 5)}/5</div></div>
      ${feel.length ? `<div class="chips">${feel.map(f => `<span class="chip on">${f.emoji} ${esc(f.label)}</span>`).join('')}</div>` : ''}
      ${ci.data.note ? `<p class="quote-inline">“${esc(ci.data.note)}”</p>` : ''}
    </section>
    <section class="card"><h3>Stress this week</h3>${bars(week, e => e.data.stress, 5, e => e ? String(num(e.data.stress, 1, 5)) : '')}<p class="fine">Higher bar = more stressed.</p></section>
    ${common.length ? `<section class="card"><h3>${me() === 'dad' ? 'On your mind lately' : 'On his mind lately'}</h3>${common.map(([id, c]) => { const f = C.DAD_FEELINGS.find(x => x.id === id); return f ? `<div class="mile"><b>${f.emoji} ${esc(f.label)}</b><span>${c}× in 2 weeks</span></div>` : '' }).join('')}</section>` : ''}
    ${me() === 'mom'
      ? (support.length ? `<section class="card"><h3>💛 How you can support him</h3><ol class="plan">${support.map(t => `<li>${esc(t)}</li>`).join('')}</ol></section>` : '')
      : selfCareCard(ci, feel) + forHerCard()}
    ${me() === 'dad' ? '<p class="fine center">Check-ins marked private stay on your phone and never show here for her.</p>' : ''}`
}

// His phone: looking after himself, from what he logged
function selfCareCard(ci, feel) {
  const steps = [...(C.SELF_CARE_STRESS[ci.data.stress] || []), ...feel.flatMap(f => f.cope.slice(0, 2))]
  const seen = new Set(), list = steps.filter(t => !seen.has(t) && seen.add(t)).slice(0, 5)
  const basics = C.SELF_CARE_BASICS[dayIndex() % C.SELF_CARE_BASICS.length]
  return `<section class="card">
    <h3>🧘 Taking care of yourself</h3>
    <p class="fine">Based on your last check-in: stress ${num(ci.data.stress, 1, 5)}/5${feel.length ? ', ' + feel.map(f => f.label.toLowerCase()).join(', ') : ''}.</p>
    <ol class="plan">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
    <p class="fine">${esc(basics)}</p>
    <button class="ghost" data-tab="checkin">🫁 Do the 2-minute breathing reset</button>
  </section>`
}

// His phone: what he can do for her, from her latest check-in
function forHerCard() {
  const n = names(), g = gest()
  const ci = latest('checkin', 'mom')
  const today = ci && sameDay(ci.created_at)
  const plan = ci ? gamePlan(ci).slice(0, 4) : []
  // skip partner tips that repeat what the self-care card already says
  const mine = new Set((latest('dadcheck', 'dad')?.data.feelings || []).flatMap(id => C.DAD_FEELINGS.find(f => f.id === id)?.cope || []))
  const redFlag = [...mine].some(t => /red-flag/i.test(t))
  const extra = [C.DAD_TRUTHS, C.DAD_TRIMESTER[g ? g.tri : 1]].map((list, k) => {
    const ok = list.filter(t => !(redFlag && /red-flag/i.test(t)))
    return pick(ok.length ? ok : list, dayIndex() + k)
  })
  return `<section class="card">
    <h3>🧭 What you can do for ${esc(n.mom)}</h3>
    ${ci ? `<p class="fine">${today ? 'From her check-in today' : `Her last check-in was ${fmtWhen(ci.created_at).toLowerCase()}. Ask how she's feeling today.`}</p>` : `<p class="fine">No check-in from her yet. A quick "How are you feeling?" is the best first step.</p>`}
    <ol class="plan">${[...plan.map(p => `<li>${esc(p.t)}<span class="why">${esc(p.why)}</span></li>`), ...extra.map(t => `<li>${esc(t)}</li>`)].join('')}</ol>
  </section>`
}

// ── History & the OB visit summary ──────────────────────────────────────────
const LVL = ['', 'mild', 'moderate', 'strong']
const weekAt = iso => { const g = gest(); if (!g) return ''; const d = dayDiff(new Date(iso).setHours(0, 0, 0, 0), g.lmp); return d >= 0 ? `Week ${Math.floor(d / 7)}+${d % 7}` : '' }
const visibleDad = () => entries('dadcheck', 'dad').filter(e => !(e.local && me() !== 'dad'))

function historyView() {
  const n = names()
  const since = histDays === 'all' ? 0 : Date.now() - histDays * DAY
  const list = [
    ...(histWho !== 'dad' ? entries('checkin', 'mom') : []),
    ...(histWho !== 'mom' ? visibleDad() : []),
  ].filter(e => new Date(e.created_at) >= since).sort((a, b) => b.created_at.localeCompare(a.created_at))
  const days = []
  for (const e of list) {
    const k = new Date(e.created_at).toDateString()
    if (!days.length || days[days.length - 1].k !== k) days.push({ k, iso: e.created_at, items: [] })
    days[days.length - 1].items.push(e)
  }
  const segBtns = (opts, cur, attr) => opts.map(([v, l]) => `<button data-${attr}="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')
  return `
    ${obSummaryCard()}
    <section class="card">
      <h3>📖 History</h3>
      <div class="seg">${segBtns([['both', 'Both'], ['mom', esc(n.mom)], ['dad', esc(n.dad)]], histWho, 'hw')}</div>
      <div class="seg">${segBtns([[14, '2 weeks'], [60, '2 months'], ['all', 'Everything']], histDays, 'hd')}</div>
      ${days.length ? days.map(day => `<div class="hday">
          <div class="hday-head"><b>${new Date(day.iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</b><span class="fine">${esc(weekAt(day.iso))}</span></div>
          ${day.items.map(historyRow).join('')}
        </div>`).join('') : '<p class="fine">Nothing logged in this range yet.</p>'}
    </section>`
}

function historyRow(e) {
  const t = new Date(e.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (e.kind === 'checkin') {
    const d = e.data, mood = C.MOOD.find(m => m.v === d.mood), en = C.ENERGY.find(m => m.v === d.energy)
    const syms = Object.entries(d.symptoms || {}).map(([id, l]) => { const s = symptom(id); l = num(l, 1, 3) | 0; return s ? `<span class="chip on l${l}">${s.emoji} ${esc(s.label)} · ${LVL[l]}</span>` : '' }).join('')
    return `<div class="hrow"><div class="hwho">🤰 ${esc(names().mom)} · ${t}</div>
      <div>${mood ? `${mood.emoji} ${mood.label}` : ''}${en ? ` · energy ${en.label.toLowerCase()}` : ''}${d.temp ? ` · 🌡️ ${esc(d.temp)}°` : ''}</div>
      ${syms ? `<div class="chips">${syms}</div>` : ''}${d.note ? `<div class="quote-inline">“${esc(d.note)}”</div>` : ''}</div>`
  }
  const f = (e.data.feelings || []).map(id => C.DAD_FEELINGS.find(x => x.id === id)).filter(Boolean)
  return `<div class="hrow"><div class="hwho">🧔 ${esc(names().dad)} · ${t}${e.local ? ' · 🔒 private' : ''}</div>
    <div>Stress ${num(e.data.stress, 1, 5)}/5${f.length ? ' · ' + f.map(x => x.emoji + ' ' + esc(x.label)).join(', ') : ''}</div>
    ${e.data.note ? `<div class="quote-inline">“${esc(e.data.note)}”</div>` : ''}</div>`
}

// A plain-text recap of her check-ins to bring to (or text before) an OB visit
let obDays = 14
function obSummaryText(days) {
  const n = names(), since = Date.now() - days * DAY
  const cis = entries('checkin', 'mom').filter(e => new Date(e.created_at) >= since)
  if (!cis.length) return ''
  const dayset = new Set(cis.map(e => new Date(e.created_at).toDateString()))
  const avg = k => { const v = cis.map(e => e.data[k]).filter(Boolean); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }
  const label = (list, v) => v ? (list.find(m => m.v === Math.round(v)) || {}).label : '—'
  const symDays = {}, symMax = {}
  for (const e of cis) for (const [id, l] of Object.entries(e.data.symptoms || {})) {
    symDays[id] = symDays[id] || new Set(); symDays[id].add(new Date(e.created_at).toDateString())
    symMax[id] = Math.max(symMax[id] || 0, l)
  }
  const syms = Object.keys(symDays).map(id => [id, symDays[id].size]).sort((a, b) => b[1] - a[1])
  const temps = cis.filter(e => parseFloat(e.data.temp)).map(e => `${new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${e.data.temp}°`)
  const flags = cis.flatMap(e => flagsFor(e).map(f => `${new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${f.s ? f.s.label : 'Flag'}`))
  const notes = cis.filter(e => e.data.note).slice(-5).map(e => `${new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: "${e.data.note}"`)
  const g = gest()
  return [
    `${n.mom}'s check-in summary, last ${days} days${g ? ` (now ${weekAt(new Date().toISOString())}, due ${fmtDate(g.due)})` : ''}`,
    `Checked in on ${dayset.size} of ${days} days.`,
    `Average mood: ${label(C.MOOD, avg('mood'))}. Average energy: ${label(C.ENERGY, avg('energy'))}. Low-mood days: ${new Set(cis.filter(e => e.data.mood && e.data.mood <= 2).map(e => new Date(e.created_at).toDateString())).size}.`,
    syms.length ? 'Symptoms:\n' + syms.map(([id, c]) => `• ${symptom(id)?.label || id}: ${c} day${c > 1 ? 's' : ''}, strongest ${LVL[symMax[id]]}`).join('\n') : 'No symptoms logged.',
    temps.length ? 'Temperatures logged: ' + temps.join(', ') : '',
    flags.length ? 'Warning signs logged: ' + flags.join(', ') : '',
    notes.length ? 'Her notes:\n' + notes.map(t => '• ' + t).join('\n') : '',
    '(From the Together app. Self-reported, not a medical record.)',
  ].filter(Boolean).join('\n\n')
}
function obSummaryCard() {
  const txt = obSummaryText(obDays)
  return `<section class="card">
    <h3>🩺 OB visit summary</h3>
    <p class="fine">A recap of ${esc(names().mom)}'s check-ins to show the doctor, or text ahead of an appointment.</p>
    <div class="seg">${[[14, 'Last 2 weeks'], [28, 'Last 4 weeks']].map(([v, l]) => `<button data-obd="${v}" class="${obDays === v ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${txt ? `<pre class="summary">${esc(txt)}</pre>
      <div class="sheet-row"><button class="big" data-act="ob-copy">📋 Copy</button><button class="big primary" data-act="ob-share">Share</button></div>` : '<p class="fine">No check-ins in this period yet.</p>'}
  </section>`
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
        return `<section class="card soft"><div class="from">${who} · ${fmtWhen(e.created_at)} ${e.local ? '🔒 private' : ''} ${del}</div><p>Stress ${num(e.data.stress, 1, 5)}/5 ${f.map(x => x.emoji + ' ' + esc(x.label)).join(', ')}</p>${e.data.note ? `<p class="quote-inline">“${esc(e.data.note)}”</p>` : ''}</section>`
      }
      return ''
    }).join('') : '<section class="card soft center"><p>Nothing yet. Check-ins and notes from both of you will show up here.</p></section>'}`
}

// ── Where the information comes from ────────────────────────────────────────
function disclaimerCard(compact) {
  const body = `The health and safety information in Together (medicines, foods, symptoms, warning signs and tips) was compiled by an AI assistant from public patient guidance by ${esc(C.SOURCES)}. ${C.REVIEWED ? 'It has been reviewed by a medical professional.' : '<b>It has not yet been reviewed by a doctor, nurse, midwife or pharmacist.</b>'} It is general information for healthy pregnancies, not medical advice, and it can't account for her own health history. Always check with your OB, midwife or pharmacist, and call 911 in an emergency.`
  if (compact) return `<details class="disclaimer"><summary>⚠️ Not medical advice, and not yet reviewed by a medical professional. <u>More</u></summary><p>${body}</p></details>`
  return `<section class="card soft disclaimer-card"><h3>ℹ️ About the health information</h3><p class="fine">${body}</p><p class="fine">Last updated ${esc(C.INFO_UPDATED)}. Free expert answers on medicines in pregnancy: MotherToBaby, 1-866-626-6847.</p></section>`
}

// ── Lookup ──────────────────────────────────────────────────────────────────
// One search over foods and medicines. Words match by start ("egg" finds
// "Eggs", "tylenol" finds Acetaminophen through its brand names).
const TIER_L = { ok: '✅ Generally OK', ask: '🟡 Depends / ask', avoid: '⛔ Avoid' }
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const stem = w => w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w
// "is sushi ok while pregnant" → just "sushi"
const STOP = new Set('is it ok okay safe can i we she you eat eating drink drinking have having take taking to a an the for of and or with in on at my baby pregnant pregnancy during while when how much many good bad fine allowed some any too'.split(' '))
const queryWords = q => norm(q).split(' ').filter(w => w.length > 1 && !STOP.has(w)).map(stem)
// Score = how many of the typed words it matches (name hits count extra).
function matches(q, fields) {
  const words = queryWords(q)
  if (!words.length) return 0
  const hay = ' ' + norm(fields.join(' ')) + ' ', name = ' ' + norm(fields[0])
  return words.reduce((s, w) => s + (hay.includes(' ' + w) ? 2 : 0) + (name.includes(' ' + w) ? 1 : 0), 0)
}
const medItem = m => `<details class="item t-${m.tier}"><summary><b>💊 ${esc(m.name)}</b>${m.aka ? `<span class="aka">${esc(m.aka)}</span>` : ''}<span class="tier">${TIER_L[m.tier]}</span></summary>${m.use ? `<p class="fine">For: ${esc(m.use)}</p>` : ''}<p>${esc(m.note)}</p></details>`
const foodItem = f => `<details class="item t-${f.tier}"><summary><b>🍽️ ${esc(f.name)}</b>${f.aka ? `<span class="aka">${esc(f.aka)}</span>` : ''}<span class="tier">${TIER_L[f.tier]}</span></summary><p>${esc(f.note)}</p></details>`

function searchResults(q) {
  // keep the closest matches: those within one word of the best score
  const rank = (arr, f) => {
    const scored = arr.map(x => [x, matches(q, f(x))]).filter(([, s]) => s)
    const best = Math.max(0, ...scored.map(([, s]) => s))
    return scored.filter(([, s]) => s >= best - 1).sort((a, b) => b[1] - a[1]).map(([x]) => x)
  }
  const foods = rank(C.FOODS, f => [f.name, f.aka || '']), meds = rank(C.MEDS, m => [m.name, m.aka || '', m.use || ''])
  const syms = rank(C.SYMPTOMS, s => [s.label])
  // not on the list: the food-safety rules that apply to what was typed
  const rules = C.FOOD_RULES.filter(r => new RegExp(r[0], 'i').test(norm(q)))
  let html = ''
  // "pink chicken", "rare steak", "raw milk": the warning wins over a list match
  const warn = rules.filter(r => r[1] === 'avoid')
  if (warn.length && (foods.length || meds.length)) html += `<section class="card warnc"><h3>⚠️ Heads up</h3>${warn.map(r => `<p>${esc(r[2])}</p>`).join('')}</section>`
  if (foods.length || meds.length) html += [...foods.slice(0, 12).map(foodItem), ...meds.slice(0, 8).map(medItem)].join('')
  if (syms.length) html += syms.slice(0, 3).map(s => `<details class="item"><summary><b>${s.emoji} ${esc(s.label)}</b><span class="tier">Symptom</span></summary><p>${esc(s.meaning)}</p>${s.flag ? `<p class="flag">Call if: ${esc(s.flag)}</p>` : ''}</details>`).join('')
  if (!foods.length && !meds.length) {
    html += rules.length
      ? `<section class="card"><h3>"${esc(lookupQuery.trim())}" isn't on our list, but these rules apply:</h3>${rules.map(r => `<div class="item t-${r[1]}"><p><b>${TIER_L[r[1]]}:</b> ${esc(r[2])}</p></div>`).join('')}</section>`
      : `<section class="card"><h3>"${esc(lookupQuery.trim())}" isn't on our list yet</h3>
          <p>Most everyday foods are fine in pregnancy when they're <b>pasteurized, washed, and cooked until hot</b>. The ones to watch:</p>
          <ul>${C.FOOD_BASICS.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <p class="fine">For a medicine or supplement, ask the pharmacist or call MotherToBaby for free (1-866-626-6847, mothertobaby.org).</p></section>`
  }
  return html
}

function lookup() {
  const q = lookupQuery.trim()
  let body = ''
  if (q) body = searchResults(q)
  else if (lookupTab === 'meds') body = C.MEDS.map(medItem).join('')
  else if (lookupTab === 'foods') body = C.FOODS.slice().sort((a, b) => a.name.localeCompare(b.name)).map(foodItem).join('')
  else if (lookupTab === 'symptoms') {
    body = C.SYMPTOMS.map(s => `<details class="item"><summary><b>${s.emoji} ${esc(s.label)}</b></summary><p>${esc(s.meaning)}</p><h4>How he can help</h4><ul>${s.help.map(h => `<li>${esc(h)}</li>`).join('')}</ul>${s.flag ? `<p class="flag">Call if: ${esc(s.flag)}</p>` : ''}</details>`).join('')
  } else {
    body = C.RED_FLAGS.map(([h, list], i) => `<section class="card ${i === 0 ? 'alert' : i === 1 ? 'warnc' : 'soft'}"><h3>${esc(h)}</h3><ul>${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')
  }
  return `
    <section class="card search-card">
      <h3>🔎 Is it safe for baby?</h3>
      <input class="search" id="q" type="search" enterkeyhint="search" placeholder="Type any food, drink or medicine: sushi, brie, Tylenol…" value="${esc(lookupQuery)}">
      ${q ? `<p class="fine">${C.FOODS.length} foods and ${C.MEDS.length} medicines in the app. Not on the list? You still get the rules that apply.</p>` : ''}
    </section>
    ${q ? '' : `<div class="seg">${[['foods', '🍽️ Food'], ['meds', '💊 Meds'], ['symptoms', '🩺 Symptoms'], ['redflags', '🚨 When to call']].map(([id, l]) => `<button data-lt="${id}" class="${lookupTab === id ? 'on' : ''}">${l}</button>`).join('')}</div>`}
    <div class="list">${body}</div>
    ${disclaimerCard()}`
}

// ── Registry ────────────────────────────────────────────────────────────────
// Shared list: either of you adds, both see who added what, either can tick
// "got it". Store carts can't be read by outside apps, so items keep a link,
// and the couple's own Amazon/Target/Babylist registries are one tap away.
let regFilter = 'need'
let startingList = false
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
let resolving = ''
async function fillNameFromLink(url) {
  const nm = $('#regName')
  if (!nm || nm.value) return
  const direct = nameFromUrl(url)
  if (direct) { nm.value = direct; formState.regName = direct; return }
  if (!/^https?:\/\/(www\.)?(a\.co|amzn\.to|amzn\.com|amzn\.eu)\//i.test(url) || resolving === url || !S.isPaired()) return
  resolving = url
  try {
    const r = await S.fn('tg-registry', { action: 'resolve', url })
    const name = r && r.url ? nameFromUrl(r.url) : ''
    const box = $('#regName'), link = $('#regUrl')
    if (box && !box.value && name) { box.value = name; formState.regName = name }
    if (link && r?.url && link.value === url) { link.value = r.url; formState.regUrl = r.url }
  } catch (e) { console.warn('could not expand link', e) }
}
// ── Ratings, reviews and recall checks ──
// The app can't read store ratings (Amazon only shares them with approved
// affiliates), so stars are typed in by whoever adds the item.
let sugCat = 'gear'
const openDetails = new Set()
const asinOf = url => (String(url).match(/\/(?:dp|gp\/product|product-reviews)\/([A-Z0-9]{10})/i) || [])[1] || ''
const amazonSearch = (q, fourUp = true) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}${fourUp ? '&rh=p_72%3A1248882011' : ''}` // p_72 = "4 Stars & Up"
function reviewsUrl(it) {
  const asin = asinOf(it.url)
  if (asin) return `https://www.amazon.com/product-reviews/${asin}?filterByStar=critical`
  return safeUrl(it.url) || amazonSearch(it.name, false)
}
// Car seats are recalled by NHTSA; other baby gear by the CPSC.
function recallKind(name, cat) {
  if (/car ?seat|booster/i.test(name)) return 'nhtsa'
  return ['gear', 'nursery', 'bath', 'feeding'].includes(cat) ? 'cpsc' : ''
}
function recallUrl(kind, name) {
  if (kind === 'nhtsa') return 'https://www.nhtsa.gov/recalls'
  const q = String(name).replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 4).join(' ')
  return `https://www.cpsc.gov/Recalls?search_combined_fields=${encodeURIComponent(q)}`
}
const recallLink = (kind, name) => kind ? `<a class="chip" href="${esc(recallUrl(kind, name))}" target="_blank" rel="noopener">🛡️ Recall check${kind === 'nhtsa' ? ' (NHTSA)' : ''}</a>` : ''
const parseStars = v => { const n = parseFloat(String(v).replace(',', '.')); return n >= 0 && n <= 5 ? Math.round(n * 10) / 10 : '' }
async function lowRating(it) {
  const r = await ask({ title: `${num(it.stars, 0, 5)}★ is rated low`, text: `Want to know why? The 1 to 3 star reviews usually show the problem: it breaks, a safety worry, or it runs small. If the same complaint keeps coming up, it's worth picking something else. Run a recall check too.`, ok: 'Show me why', cancel: 'Keep it' })
  if (r && !window.open(reviewsUrl(it), '_blank', 'noopener')) toast('Tap "why?" on the item to see its reviews')
}
function suggestCard(items) {
  const onList = g => items.some(i => i.data.sug === g[0] || new RegExp(g[5], 'i').test(i.data.name || ''))
  const cats = C.REG_CATS.filter(([id]) => C.REG_GUIDE.some(g => g[1] === id))
  const list = C.REG_GUIDE.filter(g => g[1] === sugCat)
  const missing = C.REG_GUIDE.filter(g => !onList(g)).length
  return `<section class="card" id="regSuggest">
    <h3>💡 Suggestions</h3>
    <p class="fine">${missing ? `${missing} common item${missing === 1 ? '' : 's'} not on your list yet.` : 'You have all the usual basics covered.'} These are kinds of items with what to look for, not specific products. 🔎 opens Amazon showing only 4★ & up.</p>
    <div class="chips">${cats.map(([id, l]) => `<button class="chip ${sugCat === id ? 'on' : ''}" data-sugcat="${id}">${l}</button>`).join('')}</div>
    ${list.map(g => {
      const [id, cat, name, why, look] = g, have = onList(g)
      return `<div class="sug ${have ? 'have' : ''}">
        <div><b>${esc(name)}</b>${why ? `<div class="fine">${esc(why)}</div>` : ''}${look ? `<div class="fine look">👀 ${esc(look)}</div>` : ''}</div>
        <div class="sug-act">${have ? '<span class="fine">✓ On your list</span>' : `<button class="mini add" data-sug-add="${id}">＋ Add</button>`}
          <a class="chip" href="${esc(amazonSearch(name))}" target="_blank" rel="noopener">🔎 4★+</a>${recallLink(g[6], name)}</div>
      </div>`
    }).join('')}
    <details data-keep="skip" ${openDetails.has('skip') ? 'open' : ''}><summary>🚫 Leave these off the list</summary>
      ${C.REG_SKIP.map(([n, w]) => `<div class="mile"><b>${esc(n)}<span class="why">${esc(w)}</span></b></div>`).join('')}
    </details>
  </section>`
}
const money = n => (n || n === 0) && !isNaN(n) ? '$' + Number(n).toFixed(Number(n) % 1 ? 2 : 0) : ''

function registry() {
  const n = names()
  const items = entries('registry')
  const need = items.filter(i => !i.data.got && !i.data.claimed), got = items.filter(i => i.data.got || i.data.claimed)
  const shown = regFilter === 'need' ? need : regFilter === 'got' ? got : items
  const left = need.reduce((t, i) => t + (parseFloat(i.data.price) || 0) * (parseInt(i.data.qty) || 1), 0)
  const links = profile().registryLinks || []
  const e = editReg ? items.find(i => i.id === editReg) : null
  const d = e ? e.data : {}
  return `
    <section class="card">
      <h3>🎁 Our registry</h3>
      <p>${items.length} item${items.length === 1 ? '' : 's'} · <b>${need.length} still needed</b>${left ? ` · about ${money(left)} to go` : ''}</p>
      <div class="seg">${[['need', 'Still need'], ['got', 'Taken ✅'], ['all', 'All']].map(([id, l]) => `<button data-regf="${id}" class="${regFilter === id ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section>
    ${C.REG_CATS.map(([cat, label]) => {
      const list = shown.filter(i => (i.data.cat || 'other') === cat)
      if (!list.length) return ''
      return `<section class="card"><h3>${label}</h3>${list.map(i => {
        const it = i.data, by = i.author_role === 'mom' ? '🤰 ' + esc(n.mom) : '🧔 ' + esc(n.dad)
        return `<div class="reg ${it.got ? 'got' : ''}">
          <button class="tick" data-reg-got="${i.id}" aria-label="Got it">${it.got ? '✅' : '⬜'}</button>
          <div class="reg-main">
            <div class="reg-name">${safeUrl(it.url) ? `<a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">${esc(it.name)}</a>` : esc(it.name)}${(parseInt(it.qty) || 1) > 1 ? ` <span class="fine">×${parseInt(it.qty)}</span>` : ''}</div>
            <div class="fine">${[it.url ? storeOf(it.url) : '', money(it.price), 'added by ' + by, it.got && it.gotBy ? 'got by ' + esc(nameOf(it.gotBy)) : ''].filter(Boolean).join(' · ')}</div>
            ${it.stars !== '' && it.stars != null ? `<div class="fine rating ${it.stars < 4 ? 'low' : ''}">${it.stars < 4 ? '⚠️ ' : '⭐ '}${num(it.stars, 0, 5)}★${it.reviews ? ` · ${Number(it.reviews).toLocaleString()} reviews` : ''}${it.reviews && it.reviews < 50 ? ' (few reviews, take with salt)' : ''}${it.stars < 4 ? ` · rated low <a href="${esc(reviewsUrl(it))}" target="_blank" rel="noopener">why?</a>` : ''}${it.ratedAt ? ` <span class="faint">as of ${esc(fmtDate(parseDate(it.ratedAt)))}</span>` : ''}</div>` : ''}
            ${!it.got && recallKind(it.name, it.cat) ? `<div class="reg-links">${recallLink(recallKind(it.name, it.cat), it.name)}</div>` : ''}
            ${it.claimed ? `<div class="claimed">🎁 <b>${esc(it.claimed.name)}</b> is getting this <button class="mini" data-reg-release="${i.id}">Release</button></div>` : ''}
            ${it.notes ? `<div class="fine reg-notes">${esc(it.notes)}</div>` : ''}
          </div>
          <div class="reg-act"><button class="mini" data-edit-reg="${i.id}" aria-label="Edit">✏️</button><button class="mini del" data-del="${i.id}" aria-label="Remove">✕</button></div>
        </div>`
      }).join('')}</section>`
    }).join('')}
    ${!shown.length ? `<section class="card soft center"><p>${items.length ? 'Nothing here.' : 'Your list is empty. Add things below, or start with the basics.'}</p>${!items.length ? `<button class="big" data-act="reg-starter">Add all ${C.REG_GUIDE.length} suggested basics</button>` : ''}</section>` : ''}
    ${suggestCard(items)}
    <section class="card" id="regForm">
      <h3>${e ? 'Edit item' : 'Add an item'}</h3>
      <label class="field">Paste a link (Amazon, Target, anywhere), optional
        <input id="regUrl" type="url" inputmode="url" placeholder="https://www.amazon.com/…" value="${esc(d.url || '')}">
      </label>
      <label class="field">What is it? <span class="fine">(filled in from the link when possible; store links sometimes cut the name short, so give it a look)</span>
        <input id="regName" placeholder="e.g. Infant car seat" value="${esc(d.name || '')}">
      </label>
      <div class="store-search"><span class="fine">Find it:</span>${[['amazon', 'Amazon 4★+'], ['target', 'Target'], ['walmart', 'Walmart']].map(([id, l]) => `<button class="chip" data-act="reg-search" data-store="${id}">🔎 ${l}</button>`).join('')}</div>
      <p class="fine">Opens the store's search. Copy the product link there, paste it above, and the name fills in.</p>
      <div class="row2">
        <label class="field">Price <input id="regPrice" inputmode="decimal" placeholder="optional" value="${esc(d.price || '')}"></label>
        <label class="field">How many <input id="regQty" inputmode="numeric" value="${esc(d.qty || '1')}"></label>
      </div>
      <div class="row2">
        <label class="field">Star rating <input id="regStars" inputmode="decimal" placeholder="e.g. 4.6" value="${esc(d.stars ?? '')}"></label>
        <label class="field">Reviews <input id="regReviews" inputmode="numeric" placeholder="e.g. 12,000" value="${esc(d.reviews || '')}"></label>
      </div>
      <details data-keep="ratingtips" ${openDetails.has('ratingtips') ? 'open' : ''}><summary class="fine">Optional: copy the stars from the store page. How to read ratings</summary>
        <ul class="fine">${C.RATING_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      </details>
      <label class="field">Category
        <select id="regCat" class="inp">${C.REG_CATS.map(([id, l]) => `<option value="${id}" ${(d.cat || 'other') === id ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </label>
      <label class="field">Notes <input id="regNotes" placeholder="color, size, why we want it…" value="${esc(d.notes || '')}"></label>
      <button class="big primary" data-act="reg-save">${e ? 'Save changes' : 'Add to registry'}</button>
      ${e ? '<button class="ghost" data-act="reg-cancel">Cancel</button>' : ''}
    </section>
    <section class="card">
      <h3>🔗 Our store registries</h3>
      ${links.length ? links.map((l, i) => `<div class="mile"><a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener"><b>${esc(l.name)}</b></a><span><button class="mini del" data-reg-link-del="${i}">✕</button></span></div>`).join('') : '<p class="fine">Keep your Amazon, Target or Babylist registry links here so both of you can open them in one tap.</p>'}
      <div class="row2"><input id="linkName" placeholder="e.g. Amazon registry"><input id="linkUrl" type="url" placeholder="https://…"></div>
      <button class="ghost" data-act="reg-link-add">＋ Save registry link</button>
      <p class="fine">Tip: Amazon's Baby Registry lets you add your partner as a co-registrant, so you can both add straight from the Amazon app too.</p>
    </section>
    ${shareCard()}
    ${publishElsewhereCard()}`
}

// ── Sharing the registry with family & friends ──────────────────────────────
let pubState = null, pubLoading = false
const PUBLIC_BASE = new URL('registry.html', location.href.split('?')[0]).toString()
const publicLink = () => pubState && pubState.token ? `${PUBLIC_BASE}?t=${pubState.token}` : ''
function loadPub() {
  if (pubLoading || pubState || !S.isPaired()) return
  pubLoading = true
  S.fn('tg-registry', { action: 'status' }).then(r => { pubState = r }, () => { pubState = { published: false, error: true } })
    .finally(() => { pubLoading = false; if (tab === 'plan' && planView === 'registry') render() })
}
function shareCard() {
  if (!S.isPaired()) return `<section class="card soft"><h3>🌐 Share with family & friends</h3><p class="fine">Pair your phones first (Plan tab). Then you can publish a public registry page.</p></section>`
  loadPub()
  if (!pubState) return `<section class="card"><h3>🌐 Share with family & friends</h3><p class="fine">Checking…</p></section>`
  if (!pubState.published) return `<section class="card">
      <h3>🌐 Share with family & friends</h3>
      <p>Publish a public page of this registry. Guests can see what you still need, open each item, and tap <b>"I'll get this"</b> so nobody buys the same thing twice.</p>
      <p class="fine">It shows only your registry: never check-ins, notes or anything else from the app. You can turn it off anytime.</p>
      <label class="toggle"><input type="checkbox" id="pubDue" checked> Show our due month on the page</label>
      <button class="big primary" data-act="pub-on">Publish our registry</button>
    </section>`
  return `<section class="card">
      <h3>🌐 Shared with family & friends</h3>
      <p>✅ <b>Live.</b> Anyone with this link can see your registry and claim items:</p>
      <div class="linkbox">${esc(publicLink())}</div>
      <button class="big primary" data-act="pub-share">Share link</button>
      <a class="ghost" href="${esc(publicLink())}" target="_blank" rel="noopener">Preview the page</a>
      <button class="ghost" data-act="pub-new">Make a new link (old one stops working)</button>
      <button class="ghost danger" data-act="pub-off">Stop sharing</button>
    </section>`
}

// Big registry sites don't let other apps add items for you, so this makes the
// hand-off quick: start a registry there, copy the list, save the link back.
const REGISTRY_SITES = [
  ['Babylist', 'https://www.babylist.com', 'Universal: add anything from any store by pasting the link (Add → Paste a link).'],
  ['Amazon Baby Registry', 'https://www.amazon.com/baby-reg/homepage', 'Open each Amazon item link and tap "Add to Baby Registry". Add your partner as a co-registrant.'],
  ['Target', 'https://www.target.com/gift-registry/baby-registry', 'Search the item in the Target app and tap "Add to registry".'],
  ['Walmart', 'https://www.walmart.com/registry/baby', 'Search the item and tap "Add to registry".'],
]
function publishElsewhereCard() {
  return `<section class="card">
    <h3>📣 Also publish on…</h3>
    <p class="fine">Want it on a big registry site too? Start one there, move items over with your list, then save that registry's link above under <b>Our store registries</b>. It'll show on your public page as "Also registered at".</p>
    ${REGISTRY_SITES.map(([n, u, how]) => `<div class="site"><a class="btn2" href="${u}" target="_blank" rel="noopener">Start on ${esc(n)}</a><span class="fine">${esc(how)}</span></div>`).join('')}
    <button class="big" data-act="reg-copy">📋 Copy our list (names, prices & links)</button>
  </section>`
}

function registryText() {
  const items = entries('registry').filter(i => !i.data.got && !i.data.claimed)
  return C.REG_CATS.map(([cat, label]) => {
    const list = items.filter(i => (i.data.cat || 'other') === cat)
    if (!list.length) return ''
    return label + '\n' + list.map(i => `• ${i.data.name}${(parseInt(i.data.qty) || 1) > 1 ? ' ×' + parseInt(i.data.qty) : ''}${i.data.price ? ' (' + money(i.data.price) + ')' : ''}${i.data.url ? ' ' + i.data.url : ''}`).join('\n')
  }).filter(Boolean).join('\n\n')
}

// ── Plan ────────────────────────────────────────────────────────────────────
function plan() {
  const seg = `<div class="seg">${[['calendar', '🗓️ Calendar'], ['registry', '🎁 Registry'], ['settings', '⚙️ Settings']].map(([id, l]) => `<button data-pv="${id}" class="${planView === id ? 'on' : ''}">${l}</button>`).join('')}</div>`
  return seg + (planView === 'registry' ? registry() : planView === 'settings' ? settings() : calendar())
}

function calendar() {
  const g = gest()
  const lmp = g ? g.lmp : null
  const appts = entries('appointment').filter(a => a.data.date).sort((a, b) => a.data.date.localeCompare(b.data.date))
  return `
    <section class="card">
      <h3>Appointments</h3>
      ${appts.length ? appts.map(a => `<div class="mile appt ${a.data.date < isoDate(new Date()) ? 'past' : ''}"><b>📅 ${esc(a.data.title)}${a.data.notes ? `<span class="why">${esc(a.data.notes)}</span>` : ''}</b><span>${fmtDate(parseDate(a.data.date))}${a.data.time ? ' · ' + esc(fmtTime(a.data.time)) : ''} <button class="mini" data-edit-appt="${a.id}">✏️</button> ${a.author_role === me() ? `<button class="mini del" data-del="${a.id}">✕</button>` : ''}</span></div>`).join('') : '<p class="fine">Add the OB visits so you both see what\'s next.</p>'}
      ${apptForm()}
    </section>
    <section class="card">
      <h3>Milestones</h3>
      <div class="timeline">${C.MILESTONES.map(m => {
        const st = !g ? '' : g.week > m.week + 1 ? 'past' : g.week >= m.week ? 'now' : ''
        const when = lmp ? fmtDate(addDays(lmp, m.week * 7)) : ''
        return `<details class="tl ${st}"><summary><span class="w">Wk ${m.week}</span><b>${esc(m.title)}</b><span class="fine">${when}</span></summary><p>${esc(m.detail)}</p></details>`
      }).join('')}</div>
    </section>
    <section class="card">
      <h3>For the partner: this trimester</h3>
      <ul>${C.DAD_TRIMESTER[g ? g.tri : 1].map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    </section>`
}

function settings() {
  const g = gest()
  const ago = S.state.lastSync ? Math.round((Date.now() - S.state.lastSync) / 60000) : null
  const waiting = S.pendingCount()
  return `
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
    </section>
    <section class="card soft">
      <h3>Sync</h3>
      ${S.status === 'removed' ? '<p><b>This phone was removed from your couple.</b> Everything here is still saved on it. To reconnect, tap Unpair above, then join again with your couple code.</p>' : ''}
      <p class="fine">${!S.syncAvailable() ? 'This copy runs on this phone only.' : !S.isPaired() ? 'Not paired yet.' : `Status: <b>${esc(S.status)}</b>${ago != null ? ` · last synced ${ago < 1 ? 'just now' : ago + ' min ago'}` : ''}${waiting ? ` · ${waiting} change${waiting === 1 ? '' : 's'} waiting to send` : ''}`}</p>
    </section>
    ${disclaimerCard()}`
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
  if (d.go) { tab = d.go; if (d.pv) planView = d.pv; render(); scrollTo(0, 0); return }
  if (d.pv) { planView = d.pv; render(); scrollTo(0, 0); return }
  if (d.goLookup) { tab = 'lookup'; lookupTab = d.goLookup; render(); scrollTo(0, 0); return }
  if (d.role && linkCode) { const c = linkCode; linkCode = null; await joinFromLink(c, d.role); return }
  if (d.role) { S.state.role = d.role; S.save(); firstRun = true; onboardStep = S.syncAvailable() && !S.isPaired() ? 2 : 1; render(); return }
  if (d.lt) { lookupTab = d.lt; render(); return }
  if (d.us) { usView = d.us; render(); return }
  if (d.hw) { histWho = d.hw; render(); return }
  if (d.hd) { histDays = d.hd === 'all' ? 'all' : +d.hd; render(); return }
  if (d.obd) { obDays = +d.obd; render(); return }
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
  if (d.sendnote) { const e = await S.addEntry('note', { text: d.sendnote }); notifyPartner('note', d.sendnote, null, e.id); toast('Sent 💌'); return }
  if (d.react) { await S.addEntry('reaction', { to: d.react, emoji: d.emoji }); toast('Sent ' + d.emoji); return }
  if (d.regf) { regFilter = d.regf; render(); return }
  if (d.sugcat) { sugCat = d.sugcat; render(); return }
  if (d.sugAdd) {
    const g = C.REG_GUIDE.find(x => x[0] === d.sugAdd); if (!g) return
    const [sug, cat, name, , look] = g
    const added = await S.addEntry('registry', { name, url: '', price: '', qty: '1', cat, notes: look, sug, got: false })
    notifyPartner('registry', '', { title: `🎁 ${nameOf(me())} added to the registry`, body: name }, added.id)
    toast(`Added ${name}. Tap ✏️ on it to add a link.`); return
  }
  if (d.regRelease) {
    const it = entries('registry').find(x => x.id === d.regRelease)
    if (await ask({ title: 'Release this item?', text: `${it?.data.claimed?.name || 'A guest'} said they'd get it. Releasing lets other guests claim it again.`, ok: 'Release' })) S.updateEntry(d.regRelease, { claimed: null })
    return
  }
  if (d.regGot) {
    const it = entries('registry').find(x => x.id === d.regGot); if (!it) return
    S.updateEntry(it.id, it.data.got ? { got: false, gotBy: null } : { got: true, gotBy: me() })
    if (!it.data.got) toast('Marked as got ✅'); return
  }
  if (d.editReg) { editReg = d.editReg; clearForm('reg'); render(); document.getElementById('regForm')?.scrollIntoView({ block: 'start' }); return }
  if (d.regLinkDel != null) { const l = (profile().registryLinks || []).slice(); l.splice(+d.regLinkDel, 1); await S.addEntry('profile', { registryLinks: l }); return }
  if (d.remDel != null) { const list = reminders().slice(); list.splice(+d.remDel, 1); setReminders(list); remindersChanged(); return }
  if (d.editAppt) { editAppt = d.editAppt; clearForm('appt'); render(); document.getElementById('apptTitle')?.scrollIntoView({ block: 'center' }); return }
  if (d.editCi) {
    const e = entries('checkin').find(x => x.id === d.editCi); if (!e) return
    draft = editDraft(e)
    tab = 'checkin'; render(); scrollTo(0, 0); return
  }
  if (d.del) { const gone = S.removeEntry(d.del); if (gone) undoToast('Deleted', () => S.restoreEntry(gone)); return }
  if (d.rmDev) {
    if (!await ask({ title: 'Remove this device?', text: 'It stops syncing right away. If it\'s one of yours, you can reconnect it later with your couple code.', ok: 'Remove', danger: true })) return
    try { await S.push('remove-device', { user_id: d.rmDev }); devices = null; toast('Device removed') } catch (e) { toast('Couldn\'t remove it. Check your signal.') }
    render(); return
  }

  switch (d.act) {
    case 'save-dates': {
      const due = $('#due').value, lmp = due ? '' : $('#lmp').value
      if (!due && !lmp) return toast('Add the due date (or the first day of the last period)')
      const typed = { due, lmp, momName: $('#momName').value.trim(), dadName: $('#dadName').value.trim(), obPhone: $('#obPhone').value.trim() }
      // share only what changed, so this phone never overwrites the other's
      // details with blanks or with values it never touched
      const cur = profile()
      const data = Object.fromEntries(Object.entries(typed).filter(([k, v]) => v && v !== cur[k]))
      // switching from a period date to the doctor's due date: the due date wins anyway
      S.state.prefs = { ...S.state.prefs, ...data }
      if (Object.keys(data).length) await S.addEntry('profile', data)
      onboardStep = firstRun ? 3 : 0
      firstRun = false
      render(); return
    }
    case 'finish-onboard': onboardStep = 0; render(); return
    case 'skip-dates':
      onboardStep = firstRun ? 3 : 0
      firstRun = false; render(); scrollTo(0, 0); return
    case 'after-connect': {
      // the partner's phone may already have shared the dates
      const p = profile()
      onboardStep = p.due || p.lmp ? 3 : 1; render(); scrollTo(0, 0); return
    }
    case 'edit-dates': onboardStep = 1; render(); scrollTo(0, 0); return
    case 'switch-role': {
      const to = other()
      if (!await ask({ title: `Make this ${nameOf(to)}'s phone?`, text: `New check-ins and notes from this phone will be saved as ${nameOf(to)}'s, and partner alerts will go to ${nameOf(me())} instead. Only do this if you handed this phone to the other person.`, ok: 'Switch' })) return
      try { await S.switchRole(to) } catch (e) { S.state.role = other(); S.save(); return toast('Couldn\'t switch. Check your signal and try again.') }
      draft = null; stamped = ''; render(); toast('This phone is now ' + nameOf(me()))
      if (pushPrefs().on) savePushSubscription().catch(() => {})
      return
    }
    case 'save-checkin': {
      if (!draft.mood) return
      const ciData = { mood: draft.mood, energy: draft.energy || null, symptoms: draft.symptoms, temp: draft.temp.trim(), note: draft.note.trim() }
      if (draft.editing) {
        S.updateEntry(draft.editing, ciData)
        draft = null; tab = 'today'; render(); scrollTo(0, 0); toast('Check-in updated'); return
      }
      const saved = await S.addEntry('checkin', ciData)
      draft = null; tab = 'today'; render(); scrollTo(0, 0)
      notifyPartner('checkin', '', nudgeFor(saved), saved.id)
      toast(S.isPaired() ? 'Shared with ' + names().dad : 'Saved'); return
    }
    case 'save-dadcheck': {
      if (!draft.stress) return
      await S.addEntry('dadcheck', { stress: draft.stress, feelings: draft.feelings, note: draft.note.trim() }, { local: draft.private })
      const priv = draft.private
      draft = null; tab = 'today'; render(); scrollTo(0, 0); toast(priv ? 'Checked in privately 🔒' : 'Checked in ✅'); return
    }
    case 'send-msg': {
      const t = $('#msg').value.trim(); if (!t) return
      const e = await S.addEntry('note', { text: t }); notifyPartner('note', t, null, e.id); clearForm('msg'); toast('Sent 💌'); return
    }
    case 'add-appt': {
      const title = $('#apptTitle').value.trim(), date = $('#apptDate').value
      if (!title || !date) return toast('Add a title and a date')
      const appt = { title, date, time: $('#apptTime').value, notes: $('#apptNotes').value.trim() }
      if (editAppt) { S.updateEntry(editAppt, appt); editAppt = null; toast('Appointment updated') } else { await S.addEntry('appointment', appt); toast('Added 📅') }
      clearForm('appt')
      return
    }
    case 'cancel-appt': editAppt = null; clearForm('appt'); render(); return
    case 'cancel-edit': draft = null; render(); return
    case 'morning-ok': S.state.prefs = { ...S.state.prefs, morningSeen: isoDate(new Date()) }; S.save(); render(); return
    case 'add-symptom': {
      const label = ((await ask({ title: 'Add your own symptom', ok: 'Add', input: true, placeholder: 'e.g. Metallic taste' })) || '').slice(0, 40)
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
      try {
        await S.joinCouple(code); clearForm('joinCode'); toast('Paired! 🎉')
        if (onboardStep === 2) { const p = profile(); onboardStep = p.due || p.lmp ? 3 : 1 }
        render()
      } catch (e) { toast(e.message || 'Could not join'); render() }
      return
    }
    case 'share-code': {
      const invite = new URL(location.href.split('?')[0].split('#')[0]); invite.search = `?c=${S.state.code}`
      const text = `Join me on Together, our pregnancy app 🤍\nOpen this on your phone: ${invite}\n(or enter code ${S.state.code})`
      if (navigator.share) navigator.share({ text }).catch(() => {})
      else { navigator.clipboard?.writeText(text); toast('Copied') }
      return
    }
    case 'reg-save': {
      const url = $('#regUrl').value.trim(), name = ($('#regName').value.trim() || nameFromUrl(url)).slice(0, 120)
      if (!name) return toast('Give it a name')
      if (url && !/^https?:\/\//i.test(url)) return toast('Links need to start with https://')
      const rawStars = $('#regStars').value.trim(), stars = parseStars(rawStars)
      if (rawStars && stars === '') return toast('Star rating should be 0 to 5, like 4.6')
      const reviews = parseInt($('#regReviews').value.replace(/[^0-9]/g, '')) || ''
      const item = { name, url, price: $('#regPrice').value.replace(/[^0-9.]/g, ''), qty: String(parseInt($('#regQty').value) || 1), cat: $('#regCat').value, notes: $('#regNotes').value.trim(), stars, reviews }
      const before = editReg ? entries('registry').find(x => x.id === editReg)?.data : null
      if (stars !== '' && (!before || before.stars !== stars)) item.ratedAt = isoDate(new Date())
      const warn = stars !== '' && stars < 4 && (!before || before.stars !== stars)
      if (editReg) { S.updateEntry(editReg, item); editReg = null; clearForm('reg'); toast('Saved') }
      else {
        const added = await S.addEntry('registry', { ...item, got: false })
        notifyPartner('registry', '', { title: `🎁 ${nameOf(me())} added to the registry`, body: name }, added.id)
        clearForm('reg')
        toast('Added 🎁')
      }
      if (warn) lowRating({ ...before, ...item })
      return
    }
    case 'reg-search': {
      // Store search pages need no API key. On iPhone these usually open in the store's app.
      const q = encodeURIComponent(($('#regName').value.trim() || 'baby registry essentials'))
      const url = { amazon: amazonSearch(decodeURIComponent(q)), target: `https://www.target.com/s?searchTerm=${q}`, walmart: `https://www.walmart.com/search?q=${q}` }[d.store]
      if (url) window.open(url, '_blank', 'noopener')
      return
    }
    case 'pub-on':
      b.disabled = true; b.textContent = 'Publishing…'
      try { pubState = await S.fn('tg-registry', { action: 'publish', show_due: $('#pubDue')?.checked !== false }); toast('Your registry is live 🎉') } catch (e) { toast('Couldn\'t publish: ' + (e.message || 'check your signal')) }
      render(); return
    case 'pub-new':
      if (!await ask({ title: 'Make a new link?', text: 'Anyone with the old link will lose access. You\'ll need to share the new one.', ok: 'Make new link' })) return
      try { pubState = await S.fn('tg-registry', { action: 'new-link' }); toast('New link ready') } catch (e) { toast('Couldn\'t make a new link') }
      render(); return
    case 'pub-off':
      if (!await ask({ title: 'Stop sharing?', text: 'The public link stops working right away. Your registry stays in the app.', ok: 'Stop sharing', danger: true })) return
      try { pubState = await S.fn('tg-registry', { action: 'unpublish' }); toast('Registry is private again') } catch (e) { toast('Couldn\'t stop sharing') }
      render(); return
    case 'pub-share': {
      const who = [profile().momName, profile().dadName].filter(Boolean).join(' & ')
      const text = `${who ? who + '\'s' : 'Our'} baby registry 🎁\n${publicLink()}`
      if (navigator.share) navigator.share({ text }).catch(() => {})
      else navigator.clipboard?.writeText(text).then(() => toast('Link copied'), () => toast(publicLink()))
      return
    }
    case 'ob-copy':
      navigator.clipboard?.writeText(obSummaryText(obDays)).then(() => toast('Summary copied'), () => toast('Couldn\'t copy on this phone'))
      return
    case 'ob-share':
      if (navigator.share) navigator.share({ text: obSummaryText(obDays) }).catch(() => {})
      else navigator.clipboard?.writeText(obSummaryText(obDays)).then(() => toast('Summary copied'))
      return
    case 'reg-copy': {
      const txt = registryText()
      if (!txt) return toast('Nothing on the list yet')
      navigator.clipboard?.writeText(txt).then(() => toast('List copied. Paste it wherever you need it.'), () => toast('Couldn\'t copy on this phone'))
      return
    }
    case 'reg-cancel': editReg = null; clearForm('reg'); render(); return
    case 'reg-starter': {
      if (entries('registry').length || startingList) return
      startingList = true; b.disabled = true
      for (const [sug, cat, name, , look] of C.REG_GUIDE) await S.addEntry('registry', { name, url: '', price: '', qty: '1', cat, notes: look, sug, got: false })
      startingList = false
      toast('Starter list added. Edit or delete anything.'); return
    }
    case 'reg-link-add': {
      const name = $('#linkName').value.trim() || 'Registry', url = $('#linkUrl').value.trim()
      if (!/^https?:\/\//i.test(url)) return toast('Paste the full link, starting with https://')
      await S.addEntry('profile', { registryLinks: [...(profile().registryLinks || []), { name, url }] }); clearForm('link'); toast('Link saved'); return
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
    case 'rotate-code': {
      if (!await ask({ title: 'Change your couple code?', text: 'Phones already connected stay connected. Old invite links, personal links and home-screen icons stop working for any phone that isn\'t connected yet. After this, re-add Together to your home screen from this page.', ok: 'Change code' })) return
      try { const code = await S.rotateCode(); stamped = ''; render(); toast('New code: ' + code.replace(/(.{4})(.{4})/, '$1-$2')) } catch (e) { toast('Couldn\'t change it. Check your signal.') }
      return
    }
    case 'copy-link':
      navigator.clipboard?.writeText(personalLink()).then(() => toast('Link copied. Keep it somewhere safe.'), () => toast(personalLink()))
      return
    case 'unpair': if (await ask({ title: 'Unpair this phone?', text: 'Entries already here stay on this phone. You can rejoin with your couple code.', ok: 'Unpair', danger: true })) { S.unpair(); stamped = ''; try { window.history.replaceState(null, '', location.pathname) } catch {} render() } return
    case 'export': {
      const blob = new Blob([JSON.stringify({ app: 'together', v: 1, exported: new Date().toISOString(), entries: S.state.entries, prefs: S.state.prefs }, null, 2)], { type: 'application/json' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `together-backup-${isoDate(new Date())}.json`; a.click()
      return
    }
    case 'reset':
      // drop ?c= from the address too, or the reload would pair it right back
      if (await ask({ title: 'Erase everything on this phone?', text: 'Shared entries stay in your couple\'s space and come back if you rejoin. Private check-ins on this phone are gone for good.', ok: 'Erase', danger: true })) { S.resetAll(); location.replace(location.pathname) }
      return
  }
})

app.addEventListener('toggle', ev => { const k = ev.target.dataset?.keep; if (k) ev.target.open ? openDetails.add(k) : openDetails.delete(k) }, true)
app.addEventListener('input', ev => {
  if (ev.target.id === 'q') {
    lookupQuery = ev.target.value
    const pos = ev.target.selectionStart
    render()
    const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos)
  }
  if (FORM_IDS.includes(ev.target.id)) formState[ev.target.id] = ev.target.value
  if (ev.target.id === 'note' || ev.target.id === 'temp') readDraftInputs()
  if (ev.target.id === 'regUrl') fillNameFromLink(ev.target.value)
})

app.addEventListener('change', async ev => {
  const t = ev.target
  if (FORM_IDS.includes(t.id)) formState[t.id] = t.value
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

let pendingRender = false
app.addEventListener('focusout', () => setTimeout(() => {
  const a = document.activeElement
  if (pendingRender && !(a && app.contains(a) && /INPUT|TEXTAREA/.test(a.tagName))) { pendingRender = false; const y = scrollY; render(); scrollTo(0, y) }
}, 50))
const claimSeen = new Set()
S.onChange(evt => {
  if (evt.type === 'storage-full') toast('This phone is out of storage space, so new changes may not be saved. Free up some space.')
  if (evt.type === 'delete-refused') toast('That one can only be removed by the person who added it.')
  const u = evt.updated
  if (u && u.kind === 'registry' && u.data?.claimed && !claimSeen.has(u.id + u.data.claimed.at)) {
    claimSeen.add(u.id + u.data.claimed.at)
    toast(`🎁 ${u.data.claimed.name} is getting ${u.data.name}`); navigator.vibrate?.(60)
  }
  if (evt.type === 'remote' && evt.added?.length) {
    const e = evt.added.at(-1)
    const who = nameOf(e.author_role)
    const msg = e.kind === 'checkin' ? (me() === 'dad' && e.author_role === 'mom' ? `${nudgeFor(e).title}. ${nudgeFor(e).body}` : `${who} just checked in`) : e.kind === 'note' ? `💌 ${who}: ${e.data.text}` : e.kind === 'reaction' ? `${who} sent ${e.data.emoji}` : e.kind === 'appointment' ? `${who} added ${e.data.title}` : e.kind === 'registry' ? `🎁 ${who} added ${e.data.name} to the registry` : ''
    if (msg) { toast(msg); navigator.vibrate?.(60) }
  }
  // don't redraw under someone mid-typing; their form is restored on the next render anyway
  const a = document.activeElement
  if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !['checkbox', 'date', 'time'].includes(a.type)))) { pendingRender = true; return }
  const y = scrollY; render(); scrollTo(0, y)
})

// refresh "today" when the phone is picked up the next morning
document.addEventListener('visibilitychange', () => { if (!document.hidden) render() })

// The same link works for both of you. A phone that doesn't know who it
// belongs to yet asks "Who's using this phone?" once, then joins.
let linkCode = null
async function boot() {
  const code = String(params.get('c') || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const r = params.get('r'), role = r === 'mom' || r === 'dad' ? r : S.state.role // older links carry &r=
  // A phone that unpaired or erased itself stays that way, even when it's
  // opened from an old home-screen icon that still carries the code.
  if (!S.state.coupleId && code.length === 8 && S.leftCode() !== code && S.syncAvailable()) {
    if (!role) { linkCode = code; render(); S.start(); return } // role picker first
    await joinFromLink(code, role)
    return
  }
  render()
  S.start()
}
async function joinFromLink(code, role) {
  const brandNew = !S.state.role && !S.state.entries.length
  // a phone that already holds its own entries asks before sharing them into a couple
  if (S.state.entries.some(e => !e.local && !e.synced) && !await ask({ title: 'Connect this phone?', text: `This link connects to couple code ${code.replace(/(.{4})(.{4})/, '$1-$2')} and shares what's on this phone with it. Only continue if your partner sent you this link.`, ok: 'Connect' })) {
    try { window.history.replaceState(null, '', location.pathname) } catch {}
    render(); S.start(); return
  }
  S.state.role = role
  S.save()
  autoJoining = true
  render()
  let ok = true
  try { await S.joinCouple(code) } catch (e) { ok = false; console.warn(e); toast('Couldn\'t connect. Check your signal and reopen the link.') }
  autoJoining = false
  // someone opening the link for the first time gets the short welcome
  const p = profile()
  onboardStep = ok && brandNew ? (p.due || p.lmp ? 3 : 1) : 0
  firstRun = ok && brandNew
  render()
  S.start()
}
boot()

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {})
