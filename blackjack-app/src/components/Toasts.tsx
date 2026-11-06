import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, type Notice } from '../state/progress'
import { onNotices } from '../state/store'
import { Icon } from './Icons'

interface Toast { id: number; title: string; body: string; icon: string; tone: 'xp' | 'big' }
let nextId = 1

export function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => {
    return onNotices((ns: Notice[]) => {
      const add: Toast[] = []
      const xp = ns.filter((n) => n.kind === 'xp').reduce((a, n) => a + (n.kind === 'xp' ? n.amount : 0), 0)
      for (const n of ns) {
        if (n.kind === 'level') add.push({ id: nextId++, title: `Level ${n.level}`, body: `You’re now a ${n.rank}.`, icon: 'crown', tone: 'big' })
        if (n.kind === 'achievement') {
          const a = ACHIEVEMENTS.find((x) => x.id === n.id)
          if (a) add.push({ id: nextId++, title: a.title, body: a.description, icon: a.icon, tone: 'big' })
        }
      }
      if (xp > 0 && ns.some((n) => n.kind === 'xp' && n.reason !== 'Correct decision')) {
        const reasons = ns.filter((n) => n.kind === 'xp' && n.reason !== 'Correct decision').map((n) => (n.kind === 'xp' ? n.reason : ''))
        add.push({ id: nextId++, title: `+${xp} XP`, body: reasons.join(' · '), icon: 'star', tone: 'xp' })
      }
      if (!add.length) return
      setToasts((t) => [...t, ...add].slice(-4))
      for (const t of add) setTimeout(() => setToasts((all) => all.filter((x) => x.id !== t.id)), t.tone === 'big' ? 4200 : 2600)
    })
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4 lg:top-6" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`pop-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-gold ${t.tone === 'big' ? 'border-gold-300/50 bg-ink-900' : 'border-white/10 bg-ink-900/95'}`}>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.tone === 'big' ? 'bg-gold-400 text-ink-950' : 'bg-gold-400/15 text-gold-200'}`}><Icon name={t.icon} size={18} /></span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-cream-50">{t.tone === 'big' && <span className="mr-1 text-gold-300">Unlocked:</span>}{t.title}</div>
            <div className="truncate text-xs text-cream-300/70">{t.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
