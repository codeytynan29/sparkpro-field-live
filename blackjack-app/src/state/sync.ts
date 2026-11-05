// Supabase sync (optional). Loaded lazily so the app stays small and fully works
// offline and without any backend configured.
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { cloudConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config'
import type { Progress } from './progress'

let client: SupabaseClient | null = null
let session: Session | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
export type SyncStatus = 'off' | 'signed-out' | 'syncing' | 'synced' | 'error'
let status: SyncStatus = cloudConfigured ? 'signed-out' : 'off'
let lastError = ''
const listeners = new Set<() => void>()

function setStatus(s: SyncStatus, err = '') {
  status = s
  lastError = err
  listeners.forEach((l) => l())
}

export function syncStatus() {
  return { status, lastError, email: session?.user.email ?? null }
}

export function onSyncChange(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

async function getClient(): Promise<SupabaseClient | null> {
  if (!cloudConfigured) return null
  if (client) return client
  const { createClient } = await import('@supabase/supabase-js')
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, storageKey: 'bj-the-table-auth' } })
  const { data } = await client.auth.getSession()
  session = data.session
  setStatus(session ? 'synced' : 'signed-out')
  client.auth.onAuthStateChange((_e, s) => {
    session = s
    setStatus(s ? 'synced' : 'signed-out')
  })
  return client
}

export async function initSync(getLocal: () => Progress, adopt: (p: Progress) => void) {
  const c = await getClient()
  if (!c || !session) return
  await pull(getLocal, adopt)
}

export async function signInWithEmail(email: string): Promise<string | null> {
  const c = await getClient()
  if (!c) return 'Cloud sync is not configured for this build.'
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split('#')[0] } })
  return error ? error.message : null
}

export async function signOut() {
  const c = await getClient()
  await c?.auth.signOut()
}

/** Newer save wins. */
export async function pull(getLocal: () => Progress, adopt: (p: Progress) => void) {
  const c = await getClient()
  if (!c || !session) return
  setStatus('syncing')
  const { data, error } = await c.from('bj_progress').select('data, updated_at').eq('user_id', session.user.id).maybeSingle()
  if (error) return setStatus('error', error.message)
  const local = getLocal()
  const remote = data?.data as Progress | undefined
  if (remote && (remote.updatedAt ?? 0) > local.updatedAt) adopt(remote)
  else await pushNow(local)
  setStatus('synced')
}

async function pushNow(p: Progress) {
  const c = await getClient()
  if (!c || !session) return
  const { error } = await c.from('bj_progress').upsert({ user_id: session.user.id, data: p, updated_at: new Date(p.updatedAt).toISOString() })
  setStatus(error ? 'error' : 'synced', error?.message ?? '')
}

export function schedulePush(p: Progress) {
  if (!cloudConfigured || !session) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void pushNow(p), 1500)
}
