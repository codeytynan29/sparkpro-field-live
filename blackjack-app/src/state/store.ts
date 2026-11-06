// App-wide store for player progress. Saves to localStorage on every change and,
// when Supabase is configured and the player has signed in, mirrors to the cloud.
import { useSyncExternalStore } from 'react'
import { blankProgress, migrate, type Ctx, type Notice, type Progress } from './progress'
import { schedulePush } from './sync'

export const STORAGE_KEY = 'bj-the-table:v1'

let storageOk = true
function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? migrate(JSON.parse(raw)) : blankProgress()
  } catch {
    storageOk = false
    return blankProgress()
  }
}

let state: Progress = typeof localStorage === 'undefined' ? blankProgress() : load()
const listeners = new Set<() => void>()
const noticeListeners = new Set<(n: Notice[]) => void>()

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    storageOk = true
  } catch {
    storageOk = false
  }
}

export function getProgress(): Progress {
  return state
}

export function storageAvailable() {
  return storageOk
}

/** Apply a change. The function receives a private copy it may mutate freely. */
export function update(fn: (p: Progress, c: Ctx) => void): Notice[] {
  const next = structuredClone(state)
  const ctx: Ctx = { now: Date.now(), notices: [] }
  fn(next, ctx)
  next.updatedAt = ctx.now
  state = next
  save()
  listeners.forEach((l) => l())
  if (ctx.notices.length) noticeListeners.forEach((l) => l(ctx.notices))
  schedulePush(state)
  return ctx.notices
}

/** Replace everything (used by cloud sync and by "reset progress"). */
export function replace(p: Progress) {
  state = migrate(p)
  save()
  listeners.forEach((l) => l())
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function onNotices(l: (n: Notice[]) => void) {
  noticeListeners.add(l)
  return () => {
    noticeListeners.delete(l)
  }
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, getProgress)
}

// Keep tabs in sync with each other.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = migrate(JSON.parse(e.newValue))
        listeners.forEach((l) => l())
      } catch {
        /* ignore malformed */
      }
    }
  })
}
