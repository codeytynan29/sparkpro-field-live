// Cloud backup & sync by private sync code. No account needed: one device creates a
// code, any other device enters it, and both share the same progress. Newer save wins.
// Everything still works offline; sync simply catches up when the network returns.
import { cloudConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config'
import { migrate, type Progress } from './progress'

const CODE_KEY = 'bj-the-table:sync-code'
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1
export type SyncStatus = 'off' | 'not-linked' | 'syncing' | 'synced' | 'offline' | 'error'

let status: SyncStatus = cloudConfigured ? 'not-linked' : 'off'
let lastError = ''
let lastSyncedAt: number | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pending: Progress | null = null
const listeners = new Set<() => void>()

function setStatus(s: SyncStatus, err = '') {
  status = s
  lastError = err
  if (s === 'synced') lastSyncedAt = Date.now()
  listeners.forEach((l) => l())
}

export function getCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY)
  } catch {
    return null
  }
}

function setCode(code: string | null) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code)
    else localStorage.removeItem(CODE_KEY)
  } catch {
    /* storage blocked */
  }
}

export function syncStatus() {
  return { status, lastError, code: getCode(), lastSyncedAt }
}

export function onSyncChange(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function isValidCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{12}$/.test(code)
}

export function formatCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, '$1-')
}

export function newCode(): string {
  const buf = new Uint32Array(12)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => ALPHABET[n % ALPHABET.length]).join('')
}

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Server said ${res.status}`)
  return (await res.json()) as T
}

interface Remote { data: Progress; updated_ms: number }

async function pullRemote(code: string): Promise<Remote | null> {
  return rpc<Remote | null>('bj_pull', { p_code: code })
}

async function pushRemote(code: string, p: Progress): Promise<{ stored: boolean; updated_ms?: number }> {
  return rpc('bj_push', { p_code: code, p_data: p, p_updated_ms: p.updatedAt })
}

function failed(e: unknown) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  setStatus(offline || e instanceof TypeError ? 'offline' : 'error', e instanceof Error ? e.message : String(e))
}

/** Pull on start-up (and when the app comes back to the foreground). */
export async function initSync(getLocal: () => Progress, adopt: (p: Progress) => void) {
  if (!cloudConfigured) return
  const run = () => syncNow(getLocal, adopt)
  await run()
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void run() })
    window.addEventListener('online', () => void run())
  }
}

export async function syncNow(getLocal: () => Progress, adopt: (p: Progress) => void) {
  const code = getCode()
  if (!code) return setStatus(cloudConfigured ? 'not-linked' : 'off')
  setStatus('syncing')
  try {
    const remote = await pullRemote(code)
    const local = getLocal()
    if (remote && remote.updated_ms > local.updatedAt) adopt(migrate(remote.data))
    else if (!remote || local.updatedAt > remote.updated_ms) await pushRemote(code, local)
    setStatus('synced')
  } catch (e) {
    failed(e)
  }
}

/** Turn on sync for this device with a brand-new code, uploading current progress. */
export async function createSync(local: Progress): Promise<string> {
  const code = newCode()
  setStatus('syncing')
  try {
    await pushRemote(code, local)
    setCode(code)
    setStatus('synced')
    return code
  } catch (e) {
    failed(e)
    throw new Error('Couldn’t reach the server. Check your connection and try again.')
  }
}

/** Link this device to an existing code. Returns the remote progress to adopt. */
export async function joinSync(raw: string): Promise<Progress> {
  const code = normalizeCode(raw)
  if (!isValidCode(code)) throw new Error('A sync code is 12 letters and numbers, like ABCD-EFGH-JK23.')
  setStatus('syncing')
  let remote: Remote | null
  try {
    remote = await pullRemote(code)
  } catch (e) {
    failed(e)
    throw new Error('Couldn’t reach the server. Check your connection and try again.')
  }
  if (!remote) {
    setStatus(getCode() ? 'synced' : 'not-linked')
    throw new Error('No saved progress was found for that code.')
  }
  setCode(code)
  setStatus('synced')
  return migrate(remote.data)
}

export function unlinkSync() {
  setCode(null)
  if (pushTimer) clearTimeout(pushTimer)
  setStatus(cloudConfigured ? 'not-linked' : 'off')
}

export function schedulePush(p: Progress) {
  if (!cloudConfigured || !getCode()) return
  pending = p
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    const code = getCode()
    const snap = pending
    if (!code || !snap) return
    setStatus('syncing')
    try {
      await pushRemote(code, snap)
      setStatus('synced')
    } catch (e) {
      failed(e)
    }
  }, 1500)
}
