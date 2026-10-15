// ── Together: the shared ledger ─────────────────────────────────────────────
// Everything both people write is an append-only "entry" ({ kind, data }).
// Entries are written to this device first (so the app never waits on the
// network), then pushed to Supabase when a backend is configured. A failed
// push stays in the outbox and is retried, so a check-in typed in a dead zone
// still reaches the partner once signal comes back.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js?v=5'

const LS = 'together.v1'
const listeners = new Set()
let sb = null
let channel = null

export const state = load()

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null')
    if (s && Array.isArray(s.entries)) return { outbox: [], ...s }
  } catch {}
  return { role: null, coupleId: null, code: null, entries: [], outbox: [], prefs: {} }
}

export function save() {
  try { localStorage.setItem(LS, JSON.stringify(state)) } catch {}
}

export const syncAvailable = () => !!(SUPABASE_URL && SUPABASE_KEY)
export const isPaired = () => !!state.coupleId

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function emit(evt) { listeners.forEach(fn => { try { fn(evt) } catch (e) { console.error(e) } }) }

const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16)
    }))

function merge(list) {
  const byId = new Map(state.entries.map(e => [e.id, e]))
  let added = []
  for (const e of list) {
    if (!byId.has(e.id)) added.push(e)
    byId.set(e.id, { ...byId.get(e.id), ...e })
  }
  state.entries = [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
  return added
}

// opts.local: never leaves this device (e.g. a private dad check-in)
export async function addEntry(kind, data, opts = {}) {
  const e = { id: uuid(), kind, data, author_role: state.role, created_at: new Date().toISOString(), local: !!opts.local }
  merge([e])
  if (!e.local && sb && state.coupleId) state.outbox.push(e.id)
  save()
  emit({ type: 'local', entry: e })
  flush()
  return e
}

export function removeEntry(id) {
  const e = state.entries.find(x => x.id === id)
  if (!e) return
  state.entries = state.entries.filter(x => x.id !== id)
  state.outbox = state.outbox.filter(x => x !== id)
  save()
  emit({ type: 'local' })
  if (sb && state.coupleId && !e.local) sb.from('tg_entries').delete().eq('id', id).then(() => {}, () => {})
}

let flushing = false
export async function flush() {
  if (!sb || !state.coupleId || flushing || !state.outbox.length) return
  flushing = true
  try {
    while (state.outbox.length) {
      const id = state.outbox[0]
      const e = state.entries.find(x => x.id === id)
      if (e) {
        const { error } = await sb.from('tg_entries').upsert({
          id: e.id, couple_id: state.coupleId, author_role: e.author_role, kind: e.kind, data: e.data, created_at: e.created_at,
        }, { onConflict: 'id', ignoreDuplicates: true })
        if (error) throw error
      }
      if (e) e.synced = true
      state.outbox.shift(); save()
    }
    setStatus('live')
  } catch (err) {
    console.warn('sync push failed, will retry', err)
    setStatus('offline')
  } finally { flushing = false }
}

export let status = syncAvailable() ? 'connecting' : 'local'
function setStatus(s) { if (s !== status) { status = s; emit({ type: 'status' }) } }

async function client() {
  if (sb) return sb
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm')
  sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'together.auth' } })
  const { data } = await sb.auth.getSession()
  if (!data.session) {
    const { error } = await sb.auth.signInAnonymously()
    if (error) throw new Error('Anonymous sign-in failed — is it enabled in Supabase Auth settings? (' + error.message + ')')
  }
  return sb
}

export async function start() {
  if (!syncAvailable()) return
  try {
    await client()
    if (state.coupleId) await connect()
    else setStatus('unpaired')
  } catch (err) {
    console.warn(err); setStatus('offline')
  }
  window.addEventListener('online', () => { flush(); if (state.coupleId) pull() })
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.coupleId) { pull(); flush() } })
}

async function pull() {
  if (!sb || !state.coupleId) return
  const { data, error } = await sb.from('tg_entries').select('id,author_role,kind,data,created_at')
    .eq('couple_id', state.coupleId).order('created_at', { ascending: true }).limit(5000)
  if (error) { setStatus('offline'); return }
  const remoteIds = new Set(data.map(e => e.id))
  // Drop only rows that were synced before and have since been deleted remotely.
  // Anything never uploaded (logged before pairing, or offline) must survive.
  state.entries = state.entries.filter(e => e.local || !e.synced || remoteIds.has(e.id))
  const added = merge(data.map(e => ({ ...e, synced: true })))
  save()
  setStatus('live')
  emit({ type: 'remote', added: added.filter(e => e.author_role !== state.role) })
}

async function connect() {
  // Queue everything this device logged before pairing *before* the first pull,
  // so nothing local is ever mistaken for a remote deletion.
  if (!state.entries.some(e => e.kind === 'profile') && state.prefs && state.prefs.lmp) {
    const { lmp, momName, dadName, obPhone } = state.prefs
    merge([{ id: uuid(), kind: 'profile', data: { lmp, momName, dadName, obPhone }, author_role: state.role, created_at: new Date().toISOString() }])
  }
  const queued = new Set(state.outbox)
  for (const e of state.entries) if (!e.local && !e.synced && !queued.has(e.id)) state.outbox.push(e.id)
  save()
  await flush()
  await pull()
  if (channel) sb.removeChannel(channel)
  channel = sb.channel('couple:' + state.coupleId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tg_entries', filter: 'couple_id=eq.' + state.coupleId }, payload => {
      const r = payload.new
      const added = merge([{ id: r.id, author_role: r.author_role, kind: r.kind, data: r.data, created_at: r.created_at, synced: true }])
      save()
      emit({ type: 'remote', added: added.filter(e => e.author_role !== state.role) })
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
  const { data, error } = await c.rpc('tg_join_couple', { p_code: code, p_role: state.role })
  if (error) throw error
  state.coupleId = data.couple_id; state.code = data.code; save()
  await connect()
}

export function unpair() {
  if (channel && sb) sb.removeChannel(channel)
  channel = null
  state.coupleId = null; state.code = null; state.outbox = []
  save()
  setStatus(syncAvailable() ? 'unpaired' : 'local')
}

export function resetAll() {
  unpair()
  try { localStorage.removeItem(LS); localStorage.removeItem('together.auth') } catch {}
}

// Calls the tg-push function as this phone's anonymous user.
export async function push(action, body = {}) {
  if (!syncAvailable() || !state.coupleId) throw new Error('Pair your phones first')
  const c = await client()
  const { data, error } = await c.functions.invoke('tg-push', { body: { action, ...body } })
  if (error) throw error
  return data
}
