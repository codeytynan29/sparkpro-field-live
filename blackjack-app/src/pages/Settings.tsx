import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icons'
import { RulesEditor } from '../components/RulesEditor'
import { PageHeader, Tabs, Toggle } from '../components/ui'
import { money } from '../components/Chip'
import { cloudConfigured } from '../config'
import { blankProgress, migrate, resetBankroll } from '../state/progress'
import { replace, storageAvailable, update, useProgress } from '../state/store'
import { onSyncChange, signInWithEmail, signOut, syncStatus } from '../state/sync'

export default function Settings() {
  const p = useProgress()
  const [name, setName] = useState(p.name)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [sync, setSync] = useState(syncStatus())
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => onSyncChange(() => setSync(syncStatus())), [])

  const exportData = () => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `blackjack-the-table-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importData = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (!data || typeof data !== 'object' || data.version !== 1) throw new Error('bad')
      replace(migrate(data))
      setMsg('Progress imported.')
    } catch {
      setMsg('That file isn’t a Blackjack: The Table progress export.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="Preferences" title="Settings" />

      <section className="panel p-5">
        <h2 className="font-display text-xl text-cream-50">You</h2>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); update((x) => { x.name = name.trim().slice(0, 24) }); setMsg('Saved.') }}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" />
          <button className="btn-gold" type="submit">Save</button>
        </form>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-xl text-cream-50">Table</h2>
        <div className="mt-3 divide-y divide-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="text-sm font-medium text-cream-100">Dealing speed</span>
            <Tabs value={p.settings.dealerSpeed} onChange={(v) => update((x) => { x.settings.dealerSpeed = v })} tabs={[{ id: 'relaxed', label: 'Relaxed' }, { id: 'normal', label: 'Normal' }, { id: 'fast', label: 'Fast' }]} />
          </div>
          <Toggle label="Show the card count at the table" hint="Running count, decks left and true count, for counting practice" checked={p.settings.showCount} onChange={(v) => update((x) => { x.settings.showCount = v })} />
          <Toggle label="Reduce motion" hint="Turns off dealing and flip animations" checked={p.settings.reduceMotion} onChange={(v) => update((x) => { x.settings.reduceMotion = v })} />
        </div>
        <div className="mt-5">
          <RulesEditor rules={p.settings.rules} presetId={p.settings.presetId} onChange={(r, id) => update((x) => { x.settings.rules = r; x.settings.presetId = id })} />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-xl text-cream-50">Training chips</h2>
        <p className="mt-1 text-sm text-cream-300/70">You have {money(p.chips.bankroll)}. Training chips have no value and can’t be bought. Resetting is free and doesn’t affect your XP or stats.</p>
        <button className="btn-ghost mt-3" onClick={() => update((x) => resetBankroll(x))}><Icon name="reset" size={16} /> Reset to $1,000</button>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-xl text-cream-50">Your progress</h2>
        <p className="mt-1 text-sm text-cream-300/70">
          {storageAvailable() ? 'Saved automatically on this device.' : 'This browser is blocking storage (private mode?). Progress will be lost when you close the tab. Export it to keep it.'}
        </p>
        {cloudConfigured ? (
          <div className="mt-4 rounded-xl bg-ink-850 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cream-50"><Icon name="cloud" size={16} /> Cloud sync</div>
            {sync.email ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-cream-200">Signed in as {sync.email} · {sync.status === 'error' ? `error: ${sync.lastError}` : sync.status}</span>
                <button className="btn-quiet px-3 py-1.5" onClick={() => signOut()}>Sign out</button>
              </div>
            ) : (
              <form className="mt-2 flex gap-2" onSubmit={async (e) => { e.preventDefault(); const err = await signInWithEmail(email); setMsg(err ?? 'Check your email for a sign-in link.') }}>
                <input className="input" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
                <button className="btn-gold shrink-0" type="submit">Email me a link</button>
              </form>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-cream-300/50">Cloud sync isn’t set up for this build, so progress stays on this device. Use export/import to move it.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={exportData}>Export progress</button>
          <button className="btn-ghost" onClick={() => file.current?.click()}>Import progress</button>
          <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          <button className="btn-quiet text-ruby-400" onClick={() => { if (confirm('Erase all progress, XP and achievements on this device? This can’t be undone.')) { replace(blankProgress()); setName(''); setMsg('Progress reset.') } }}>Reset all progress</button>
        </div>
      </section>

      {msg && <p className="text-center text-sm text-gold-100" role="status">{msg}</p>}

      <section className="panel-soft p-5 text-sm text-cream-300/70">
        <p><b className="text-cream-100">Blackjack: The Table</b> is an educational simulator using training chips only. It offers no real-money gambling and no deposits.</p>
        <p className="mt-2">Strategy charts follow published total-dependent basic strategy and are checked against this app’s own expected-value calculator. Probabilities and EVs shown are computed, using an infinite-deck model where noted.</p>
        <p className="mt-2">If gambling stops being fun, help is free and confidential: call or text 1-800-GAMBLER.</p>
      </section>
    </div>
  )
}
