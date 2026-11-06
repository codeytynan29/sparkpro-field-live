import { RULE_PRESETS, sanitizeRules, type TableRules } from '../engine/rules'
import { Toggle } from './ui'

export function RulesEditor({ rules, presetId, onChange, showTable = true }: { rules: TableRules; presetId?: string; onChange: (r: TableRules, presetId: string) => void; showTable?: boolean }) {
  const set = (patch: Partial<TableRules>) => onChange(sanitizeRules({ ...rules, ...patch }), 'custom')
  return (
    <div className="space-y-5">
      <div>
        <div className="label mb-2">Table presets</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {RULE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...p.rules, playerHands: rules.playerHands }, p.id)}
              className={`rounded-xl border p-3 text-left transition ${presetId === p.id ? 'border-gold-300/60 bg-gold-400/10' : 'border-white/8 bg-ink-850 hover:border-gold-400/30'}`}
            >
              <div className="text-sm font-semibold text-cream-50">{p.name}</div>
              <div className="mt-0.5 text-xs text-cream-300/65">{p.blurb}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
        <div>
          <div className="label mb-1.5 mt-2">Decks</div>
          <div className="flex gap-1.5">
            {([1, 2, 4, 6, 8] as const).map((d) => (
              <button key={d} onClick={() => set({ decks: d })} className={`h-9 flex-1 rounded-lg text-sm font-semibold ${rules.decks === d ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{d}</button>
            ))}
          </div>
          <div className="label mb-1.5 mt-4">Blackjack pays</div>
          <div className="flex gap-1.5">
            {(['3:2', '6:5'] as const).map((p) => (
              <button key={p} onClick={() => set({ blackjackPayout: p })} className={`h-9 flex-1 rounded-lg text-sm font-semibold ${rules.blackjackPayout === p ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{p}</button>
            ))}
          </div>
          <div className="label mb-1.5 mt-4">Double down on</div>
          <div className="flex gap-1.5">
            {(['any', '9-11', '10-11'] as const).map((p) => (
              <button key={p} onClick={() => set({ doubleOn: p })} className={`h-9 flex-1 rounded-lg text-sm font-semibold ${rules.doubleOn === p ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{p === 'any' ? 'Any 2' : p}</button>
            ))}
          </div>
          <div className="label mb-1.5 mt-4">Split up to</div>
          <div className="flex gap-1.5">
            {([2, 3, 4] as const).map((n) => (
              <button key={n} onClick={() => set({ maxSplitHands: n })} className={`h-9 flex-1 rounded-lg text-sm font-semibold ${rules.maxSplitHands === n ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{n} hands</button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/5">
          <Toggle label="Dealer hits soft 17 (H17)" hint="Off = dealer stands on all 17s (S17)" checked={rules.dealerHitsSoft17} onChange={(v) => set({ dealerHitsSoft17: v })} />
          <Toggle label="Double after split" checked={rules.doubleAfterSplit} onChange={(v) => set({ doubleAfterSplit: v })} />
          <Toggle label="Late surrender" checked={rules.lateSurrender} onChange={(v) => set({ lateSurrender: v })} />
          <Toggle label="Resplit Aces" checked={rules.resplitAces} onChange={(v) => set({ resplitAces: v })} />
          <Toggle label="Hit split Aces" hint="Most casinos give one card per split Ace" checked={rules.hitSplitAces} onChange={(v) => set({ hitSplitAces: v })} />
        </div>
      </div>
      {showTable && (
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">Table minimum</span>
            <input type="number" inputMode="numeric" min={1} className="input mt-1.5" value={rules.minBet} onChange={(e) => set({ minBet: Number(e.target.value) || 1 })} />
          </label>
          <label className="block">
            <span className="label">Table maximum</span>
            <input type="number" inputMode="numeric" min={1} className="input mt-1.5" value={rules.maxBet} onChange={(e) => set({ maxBet: Number(e.target.value) || rules.minBet })} />
          </label>
          <div>
            <span className="label">Hands at once</span>
            <div className="mt-1.5 flex gap-1.5">
              {([1, 2, 3] as const).map((n) => (
                <button key={n} onClick={() => set({ playerHands: n })} className={`h-[42px] flex-1 rounded-lg text-sm font-semibold ${rules.playerHands === n ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-cream-200'}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
