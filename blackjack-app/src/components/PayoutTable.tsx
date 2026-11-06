import { useState } from 'react'
import { money } from './Chip'

export function PayoutTable() {
  const [bet, setBet] = useState(25)
  const rows: [string, string, number][] = [
    ['Win', '1 to 1', bet],
    ['Blackjack (3:2 table)', '3 to 2', bet * 1.5],
    ['Blackjack (6:5 table)', '6 to 5', bet * 1.2],
    ['Push', 'Bet returned', 0],
    ['Surrender', 'Lose half', -bet / 2],
    ['Double down, win', '1 to 1 on double the bet', bet * 2],
    ['Double down, lose', 'Lose double the bet', -bet * 2],
    ['Insurance wins (dealer blackjack)', '2 to 1 on half the bet', bet],
    ['Insurance loses', 'Lose the insurance bet', -bet / 2],
    ['Even money', '1 to 1 on your blackjack', bet],
  ]
  return (
    <div>
      <label className="mb-3 flex items-center gap-3 text-sm">
        <span className="text-cream-200">Your bet</span>
        <input type="number" inputMode="numeric" className="input w-28" min={1} value={bet} onChange={(e) => setBet(Math.max(1, Number(e.target.value) || 1))} aria-label="Bet amount" />
      </label>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-cream-300/50">
            <th className="pb-2 font-semibold">Result</th>
            <th className="pb-2 font-semibold">Pays</th>
            <th className="pb-2 text-right font-semibold">Net</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map(([a, b, n]) => (
            <tr key={a}>
              <td className="py-2 pr-2 text-cream-100">{a}</td>
              <td className="py-2 pr-2 text-cream-300/70">{b}</td>
              <td className={`py-2 text-right font-semibold tabular-nums ${n > 0 ? 'text-emerald-300' : n < 0 ? 'text-ruby-400' : 'text-cream-200'}`}>{money(n, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-cream-300/55">Insurance assumes the full half-bet. When insurance wins, your main bet loses to the dealer’s blackjack, so the two cancel out.</p>
    </div>
  )
}
