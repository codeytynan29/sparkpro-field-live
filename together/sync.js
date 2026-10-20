// ── Together: the shared ledger ─────────────────────────────────────────────
// Everything both people write is an "entry" ({ kind, data }). Entries are
// written to this device first (so the app never waits on the network), then
// pushed to Supabase. Anything that can't be sent yet waits in a queue and is
// retried, so a check-in typed in a dead zone still reaches the partner once
// signal comes back.
//
// Three queues, all saved with the rest of the state:
//   outbox   new entries not uploaded yet
//   patches  edits to entries that are already uploaded: only the changed
//            fields, merged on the server (data || patch), so two phones (or a
//            guest claiming a registry item) never erase each other's changes
//   deletes  removals, held a few seconds so they can be undone
import { SUPABASE_URL, SUPABASE_KEY } from './config.js?v=6'

const LS = 'together.v1'
const UNDO_MS = 6000
const LEFT = 'together.left' // couple code this phone chose to leave (survives "Erase")
const listeners = new Set()
let sb = null
let channel = null
// When this phone last uploaded or patched an entry. A pull that started
// before that moment may hold a stale copy, so it must not overwrite or drop it.
const touched = new Map()
const touch = id => touched.set(id, Date.now())

export const state = load()

function load() {
  let s = null
  try { s = JSON.parse(localStorage.getItem(LS) || 'null') } catch {}
  if (!s || !Array.isArray(s.entries)) s = { role: null, coupleId: null, code: null, entries: [], prefs: {} }
  s.outbox = s.outbox || []
  s.patches = s.patches || {}
  s.deletes = s.deletes || []
  // older versions queued whole-entry edits by id; send those as a full patch
  for (const id of s.pending || []) {
    const e = s.entries.find(x => x.id === id)
    if (e) s.patches[id] = { ...(s.patches[id] || {}), ...e.data }
  }
  delete s.pending
  return s
}

let warnedFull = false
export function save() {
  try { localStorage.setItem(LS, JSON.stringify(state)) } catch (e) {
    console.error('could not save', e)
    if (!warnedFull) { warnedFull = true; emit({ type: 'storage-full' }) }
  }
}

export const syncAvailable = () => !!(SUPABASE_URL && SUPABASE_KEY)
export const isPaired = () => !!state.coupleId
export const pendingCount = () => state.outbox.length + Object.keys(state.patches).length + state.deletes.length

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function emit(evt) { listeners.forEach(fn => { try { fn(evt) } catch (e) { console.error(e) } }) }

const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16)
    }))

// Remote rows win, except for fields this phone changed and hasn't sent yet.
function merge(list) {
  const byId = new Map(state.entries.map(e => [e.id, e]))
  const added = []
  for (const e of list) {
    const p = state.patches[e.id]
    const next = p ? { ...e, data: { ...e.data, ...p } } : e
    if (!byId.has(e.id)) added.push(next)
    byId.set(e.id, { ...byId.get(e.id), ...next })
  }
  state.entries = [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
  return added
}

// opts.local: never leaves this device (e.g. a private dad check-in)
export async function addEntry(kind, data, opts = {}) {
  const e = { id: uuid(), kind, data, author_role: state.role, created_at: new Date().toISOString(), local: !!opts.local }
  merge([e])
  if (!e.local && state.coupleId) state.outbox.push(e.id)
  save()
  emit({ type: 'local', entry: e })
  flush()
  return e
}

// Edit an entry in place (either partner can, e.g. registry "got it").
export function updateEntry(id, patch) {
  const e = state.entries.find(x => x.id === id)
  if (!e) return
  e.data = { ...e.data, ...patch }
  e.edited_at = new Date().toISOString()
  // not uploaded yet: the outbox will send the whole, already-edited entry
  if (!e.local && e.synced) state.patches[id] = { ...(state.patches[id] || {}), ...patch }
  save()
  emit({ type: 'local' })
  flush()
}

// Remove now on this phone; the server delete waits UNDO_MS so it can be undone.
export function removeEntry(id) {
  const e = state.entries.find(x => x.id === id)
  if (!e) return null
  state.entries = state.entries.filter(x => x.id !== id)
  // in place: flush() may be walking this same queue right now
  const i = state.outbox.indexOf(id); if (i >= 0) state.outbox.splice(i, 1)
  delete state.patches[id]
  if (!e.local && e.synced) state.deletes.push({ id, at: Date.now() })
  save()
  emit({ type: 'local' })
  setTimeout(flush, UNDO_MS + 200)
  return e
}

export function restoreEntry(e) {
  if (!e) return
  const waiting = state.deletes.some(d => d.id === e.id)
  state.deletes = state.deletes.filter(d => d.id !== e.id)
  // if the server delete already went through, upload it again
  const copy = { ...e, synced: waiting ? e.synced : false }
  merge([copy])
  if (!copy.local && !copy.synced && state.coupleId) state.outbox.push(copy.id)
  save()
  emit({ type: 'local' })
  flush()
}

// Errors the server will keep giving no matter how often we retry (not
// allowed, bad data). Those items are dropped so they can't block the queue.
const permanent = err => !!err && /^(42|22|23|PGRST)/.test(String(err.code || ''))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// One flush at a time. Asking again while one runs queues one more pass, and
// callers can await whichever pass is running (so a pull never overtakes it).
let running = null, again = false
export function flush() {
  if (!sb || !state.coupleId || !pendingCount()) return running || Promise.resolve()
  if (running) { again = true; return running }
  again = false
  running = flushOnce().finally(() => {
    running = null
    if (again) flush()
    else if (state.deletes.length) setTimeout(flush, UNDO_MS)
  })
  return running
}
async function flushOnce() {
  try {
    while (state.outbox.length) {
      const id = state.outbox[0]
      const e = state.entries.find(x => x.id === id)
      if (e) {
        const sent = JSON.parse(JSON.stringify(e.data))
        const { error } = await sb.from('tg_entries').upsert({
          id: e.id, couple_id: state.coupleId, author_role: e.author_role, kind: e.kind, data: sent, created_at: e.created_at,
        }, { onConflict: 'id', ignoreDuplicates: true })
        if (error && !permanent(error)) throw error
        e.synced = !error
        if (error) { e.rejected = true; console.warn('server refused entry', id, error) }
        touch(id)
        const cur = state.entries.find(x => x.id === id)
        if (!error && !cur) state.deletes.push({ id, at: Date.now() }) // deleted while it was uploading
        if (!error && cur) {
          cur.synced = true
          // edited while it was uploading: send just the fields that changed
          const diff = Object.fromEntries(Object.entries(cur.data).filter(([k, v]) => !same(v, sent[k])))
          if (Object.keys(diff).length) state.patches[id] = { ...diff, ...(state.patches[id] || {}) }
        }
      }
      const i = state.outbox.indexOf(id); if (i >= 0) state.outbox.splice(i, 1)
      save()
    }
    for (const id of Object.keys(state.patches)) {
      const patch = state.patches[id]
      const { data: ok, error } = await sb.rpc('tg_patch', { p_id: id, p_patch: patch })
      if (error && !permanent(error)) throw error
      touch(id)
      // only clear it if nothing new was merged in while it was on the way
      if (state.patches[id] === patch) delete state.patches[id]
      if (error || ok === false) console.warn('edit not applied', id, error)
      save()
    }
    const due = state.deletes.filter(d => Date.now() - d.at >= UNDO_MS)
    for (const d of due) {
      const { data: ok, error } = await sb.rpc('tg_delete', { p_id: d.id })
      if (error && !permanent(error)) throw error
      touch(d.id)
      state.deletes = state.deletes.filter(x => x.id !== d.id); save()
      if (error || ok === false) emit({ type: 'delete-refused', id: d.id })
    }
    state.lastSync = Date.now(); save()
    setStatus('live')
  } catch (err) {
    console.warn('sync push failed, will retry', err)
    setStatus('offline')
  }
}

export let status = syncAvailable() ? 'connecting' : 'local'
function setStatus(s) { if (s !== status) { status = s; emit({ type: 'status' }) } }

async function client() {
  if (sb) return sb
  // Shipped with the app (vendor/), so syncing never depends on a CDN being up.
  // The CDN import is only a fallback if that file somehow failed to load.
  const { createClient } = window.supabase || await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm')
  sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'together.auth' } })
  const { data } = await sb.auth.getSession()
  if (!data.session) {
    const { error } = await sb.auth.signInAnonymously()
    if (error) throw new Error('Anonymous sign-in failed — is it enabled in Supabase Auth settings? (' + error.message + ')')
  }
  return sb
}

let started = false
export async function start() {
  if (!syncAvailable()) return
  try {
    await client()
    if (state.coupleId) await connect()
    else setStatus('unpaired')
  } catch (err) {
    console.warn(err); setStatus('offline')
  }
  if (started) return
  started = true
  const catchUp = () => { if (!state.coupleId) return; if (!sb) { start(); return } flush().then(() => pull()) }
  window.addEventListener('online', catchUp)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) catchUp() })
  // live updates can drop silently (sleep, network switch); re-check every minute
  setInterval(() => { if (!document.hidden) catchUp() }, 60000)
}

async function pull(quiet = false) {
  if (!sb || !state.coupleId) return
  const started = Date.now()
  // page through: the server returns at most 1000 rows per request
  const data = []
  for (let from = 0; ; from += 1000) {
    const { data: page, error } = await sb.from('tg_entries').select('id,author_role,kind,data,created_at')
      .eq('couple_id', state.coupleId).order('created_at', { ascending: true }).order('id').range(from, from + 999)
    if (error) { setStatus('offline'); return }
    data.push(...page)
    if (page.length < 1000) break
  }
  // Nothing came back but this phone has synced entries: it may have been
  // removed from the couple. Keep everything on screen instead of wiping it.
  if (!data.length && state.entries.some(e => e.synced)) {
    const { data: role } = await sb.rpc('tg_my_role', { c: state.coupleId })
    if (!role) { setStatus('removed'); return }
  }
  const fresh = id => (touched.get(id) || 0) >= started // changed here after this pull began
  const remoteIds = new Set(data.map(e => e.id))
  const deleting = new Set(state.deletes.map(d => d.id))
  // Drop only rows that were synced before and have since been deleted remotely.
  // Anything never uploaded (logged before pairing, or offline) must survive.
  state.entries = state.entries.filter(e => e.local || !e.synced || remoteIds.has(e.id) || fresh(e.id))
  const added = merge(data.filter(e => !deleting.has(e.id) && !fresh(e.id)).map(e => ({ ...e, synced: true })))
  state.lastSync = Date.now()
  save()
  setStatus('live')
  emit({ type: 'remote', added: quiet ? [] : added.filter(e => e.author_role !== state.role) })
}

async function connect() {
  // Queue everything this device logged before pairing *before* the first pull,
  // so nothing local is ever mistaken for a remote deletion.
  if (!state.entries.some(e => e.kind === 'profile') && state.prefs && (state.prefs.lmp || state.prefs.due)) {
    // only the fields actually filled in, so blanks never overwrite the partner's
    const data = Object.fromEntries(['due', 'lmp', 'momName', 'dadName', 'obPhone'].map(k => [k, state.prefs[k]]).filter(([, v]) => v))
    merge([{ id: uuid(), kind: 'profile', data, author_role: state.role, created_at: new Date().toISOString() }])
  }
  const queued = new Set(state.outbox)
  for (const e of state.entries) if (!e.local && !e.synced && !e.rejected && !queued.has(e.id)) state.outbox.push(e.id)
  save()
  sb.rpc('tg_touch', { c: state.coupleId }).then(() => {}, () => {})
  // the code may have been changed from the other phone
  sb.from('tg_couples').select('code').eq('id', state.coupleId).maybeSingle()
    .then(({ data }) => { if (data?.code && data.code !== state.code) { state.code = data.code; save(); emit({ type: 'local' }) } }, () => {})
  await flush()
  await pull(true)
  if (channel) sb.removeChannel(channel)
  const row = r => ({ id: r.id, author_role: r.author_role, kind: r.kind, data: r.data, created_at: r.created_at, synced: true })
  channel = sb.channel('couple:' + state.coupleId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tg_entries', filter: 'couple_id=eq.' + state.coupleId }, payload => {
      if (state.deletes.some(d => d.id === payload.new.id)) return
      const added = merge([row(payload.new)])
      save()
      emit({ type: 'remote', added: added.filter(e => e.author_role !== state.role) })
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tg_entries', filter: 'couple_id=eq.' + state.coupleId }, payload => {
      if (state.deletes.some(d => d.id === payload.new.id)) return
      merge([row(payload.new)])
      save()
      emit({ type: 'remote', added: [], updated: payload.new })
    })
    // DELETE events can't be filtered by couple and only carry the id
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tg_entries' }, payload => {
      if (payload.old && state.entries.some(e => e.id === payload.old.id)) pull()
    })
    .subscribe(s => {
      if (s === 'SUBSCRIBED') setStatus('live')
      else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('offline')
    })
  flush()
}

export async function createCouple() {
  const c = await client()
  const { data, error } = await c.rpc('tg_create_couple', { p_role: state.role })
  if (error) throw error
  state.coupleId = data.couple_id; state.code = data.code; save()
  await connect()
  return data.code
}

export async function joinCouple(code) {
  const c = await client()
  try { localStorage.removeItem(LEFT) } catch {}
  const { data, error } = await c.rpc('tg_join_couple', { p_code: code, p_role: state.role })
  if (error) throw error
  state.coupleId = data.couple_id; state.code = data.code; save()
  await connect()
}

export function unpair() {
  try { if (state.code) localStorage.setItem(LEFT, state.code) } catch {}
  if (channel && sb) sb.removeChannel(channel)
  channel = null
  state.coupleId = null; state.code = null; state.outbox = []; state.patches = {}; state.deletes = []
  save()
  setStatus(syncAvailable() ? 'unpaired' : 'local')
}

export function resetAll() {
  unpair()
  try { localStorage.removeItem(LS); localStorage.removeItem('together.auth') } catch {}
}
// The couple code this phone deliberately left; a link with it won't auto-rejoin.
export const leftCode = () => { try { return localStorage.getItem(LEFT) } catch { return null } }

// This phone becomes the other person: re-join under the new role so the
// server tags new entries (and partner alerts) correctly.
export async function switchRole(role) {
  state.role = role; save()
  if (!state.coupleId || !state.code) return
  const c = await client()
  const { error } = await c.rpc('tg_join_couple', { p_code: state.code, p_role: role })
  if (error) throw error
}

// Bump photos: the full image goes to private storage (only this couple can
// read it); the entry keeps a small thumbnail so the timeline works offline.
export async function uploadPhoto(path, blob) {
  if (!state.coupleId) throw new Error('Pair your phones first')
  const c = await client()
  const { error } = await c.storage.from('tg-photos').upload(`${state.coupleId}/${path}`, blob, { contentType: blob.type || 'image/jpeg', upsert: true })
  if (error) throw error
  return `${state.coupleId}/${path}`
}
const urlCache = new Map()
export async function photoUrl(path) {
  const hit = urlCache.get(path)
  if (hit && hit.until > Date.now()) return hit.url
  const c = await client()
  const { data, error } = await c.storage.from('tg-photos').createSignedUrl(path, 3600)
  if (error) throw error
  urlCache.set(path, { url: data.signedUrl, until: Date.now() + 3500e3 })
  return data.signedUrl
}
export async function removePhoto(path) {
  const c = await client()
  await c.storage.from('tg-photos').remove([path])
}

// A new couple code. Paired phones stay paired; old invite links stop working.
export async function rotateCode() {
  const c = await client()
  const { data, error } = await c.rpc('tg_rotate_code')
  if (error) throw error
  state.code = data; save()
  return data
}

// Calls the tg-push function as this phone's anonymous user.
export async function push(action, body = {}) {
  if (!syncAvailable() || !state.coupleId) throw new Error('Pair your phones first')
  const c = await client()
  const { data, error } = await c.functions.invoke('tg-push', { body: { action, ...body } })
  if (error) throw error
  return data
}

// Calls another edge function (e.g. tg-registry) as this phone's user.
export async function fn(name, body = {}) {
  if (!syncAvailable() || !state.coupleId) throw new Error('Pair your phones first')
  const c = await client()
  const { data, error } = await c.functions.invoke(name, { body })
  if (error) throw error
  return data
}
