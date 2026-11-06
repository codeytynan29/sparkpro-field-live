import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icons'
import { RulesEditor } from '../components/RulesEditor'
import { PageHeader, Tabs, Toggle } from '../components/ui'
import { money } from '../components/Chip'
import { cloudConfigured } from '../config'
import { blankProgress, migrate, resetBankroll } from '../state/progress'
import { replace, storageAvailable, update, useProgress } from '../state/store'
import { createSync, formatCode, getCode, joinSync, onSyncChange, syncNow, syncStatus, unlinkSync } from '../state/sync'
import { getProgress } from '../state/store'

export default function Settings() {
  const p = useProgress()
  const [name, setName] = useState(p.name)
  const [msg, setMsg] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

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
        {cloudConfigured ? <CloudSync onMessage={setMsg} /> : (
          <p className="mt-2 text-xs text-cream-300/50">Cloud sync is turned off in this build, so progress stays on this device. Use export/import to move it.</p>
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

function CloudSync({ onMessage }: { onMessage: (m: string) => void }) {
  const [sync, setSync] = useState(syncStatus())
  const [entry, setEntry] = useState('')
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState(false)
  useEffect(() => onSyncChange(() => setSync(syncStatus())), [])
  const code = sync.code ?? getCode()
  const label: Record<string, string> = { synced: 'Synced', syncing: 'Syncing…', offline: 'Offline: will sync when you’re back online', error: 'Sync error', 'not-linked': 'Not linked', off: 'Off' }
  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } catch (e) { onMessage(e instanceof Error ? e.message : 'Something went wrong.') } finally { setBusy(false) }
  }
  return (
    <div className="mt-4 rounded-xl bg-ink-850 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-cream-50"><Icon name="cloud" size={16} /> Cloud backup &amp; sync</div>
        <span className={`text-xs ${sync.status === 'synced' ? 'text-emerald-300' : sync.status === 'error' ? 'text-ruby-400' : 'text-cream-300/60'}`}>{label[sync.status]}</span>
      </div>
      {code ? (
        <div className="mt-3">
          <p className="text-sm text-cream-200/80">Your progress is backed up. To continue on another phone or computer, open the app there, go to Settings and enter this code:</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-ink-950 px-3 py-2 font-mono text-lg tracking-widest text-gold-100" aria-label="Your sync code">{shown ? formatCode(code) : '••••-••••-••••'}</code>
            <button className="btn-quiet px-3 py-1.5 text-xs" onClick={() => setShown((v) => !v)}>{shown ? 'Hide' : 'Show code'}</button>
            {shown && <button className="btn-quiet px-3 py-1.5 text-xs" onClick={() => { navigator.clipboard?.writeText(formatCode(code)).then(() => onMessage('Code copied.'), () => {}) }}>Copy</button>}
          </div>
          <p className="mt-2 text-[11px] text-cream-300/55">Treat it like a password: anyone with this code can see and change this progress.{sync.lastSyncedAt ? ` Last synced ${new Date(sync.lastSyncedAt).toLocaleTimeString()}.` : ''}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-ghost px-3 py-2 text-sm" disabled={busy} onClick={() => run(() => syncNow(getProgress, replace))}>Sync now</button>
            <button className="btn-quiet px-3 py-2 text-sm" onClick={() => { if (confirm('Stop syncing this device? Your progress stays here and in the cloud.')) { unlinkSync(); onMessage('This device is no longer syncing.') } }}>Stop syncing on this device</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-cream-200/80">Back up this device’s progress and get a code to use on your other devices.</p>
            <button className="btn-gold mt-2" disabled={busy} onClick={() => run(async () => { await createSync(getProgress()); setShown(true); onMessage('Backed up. Your sync code is ready.') })}>Turn on sync</button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); run(async () => {
            const remote = await joinSync(entry)
            if (Object.keys(getProgress().lessons).length || getProgress().decisions.total) {
              if (!confirm('Replace the progress on this device with the progress saved under that code?')) { unlinkSync(); return }
            }
            replace(remote)
            onMessage('Linked. Progress loaded from the cloud.')
          }) }}>
            <p className="text-sm text-cream-200/80">Already have a code from another device?</p>
            <div className="mt-2 flex gap-2">
              <input className="input font-mono uppercase tracking-wider" placeholder="ABCD-EFGH-JK23" value={entry} onChange={(e) => setEntry(e.target.value)} aria-label="Sync code" autoComplete="off" />
              <button className="btn-ghost shrink-0" type="submit" disabled={busy || entry.trim().length < 12}>Link</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
