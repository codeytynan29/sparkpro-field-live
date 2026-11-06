export const CHIP_VALUES = [1, 5, 25, 100, 500] as const
export const CHIP_STYLE: Record<number, { base: string; edge: string; text: string; name: string }> = {
  1: { base: '#e9e4d8', edge: '#2d5aa0', text: '#1e2a3a', name: 'White' },
  5: { base: '#b5262e', edge: '#f3ead3', text: '#fff6e6', name: 'Red' },
  25: { base: '#1d7a46', edge: '#f3ead3', text: '#fff6e6', name: 'Green' },
  100: { base: '#17181b', edge: '#d4a63b', text: '#f4e7bf', name: 'Black' },
  500: { base: '#5b2a86', edge: '#f3ead3', text: '#fff6e6', name: 'Purple' },
  1000: { base: '#d98a1c', edge: '#17181b', text: '#17181b', name: 'Orange' },
}

export function chipLabel(v: number) {
  return v >= 1000 ? `${v / 1000}K` : String(v)
}

export function Chip({ value, size = 44, className = '' }: { value: number; size?: number; className?: string }) {
  const s = CHIP_STYLE[value] ?? CHIP_STYLE[100]
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill={s.base} stroke="rgba(0,0,0,.45)" strokeWidth="1" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="21" y="1.5" width="6" height="7" rx="1" fill={s.edge} transform={`rotate(${i * 45} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="15" fill={s.base} stroke={s.edge} strokeWidth="1.2" strokeDasharray="2 2" />
      <circle cx="17" cy="15" r="9" fill="#fff" opacity=".10" />
      <text x="24" y="28.5" textAnchor="middle" fontSize={value >= 100 ? 11 : 13} fontWeight="800" fill={s.text} fontFamily="Inter Variable, system-ui">{chipLabel(value)}</text>
    </svg>
  )
}

/** Break an amount into casino chips, largest first. */
export function toChips(amount: number): number[] {
  const out: number[] = []
  let left = Math.floor(amount)
  for (const v of [1000, 500, 100, 25, 5, 1]) {
    while (left >= v && out.length < 12) {
      out.push(v)
      left -= v
    }
  }
  return out
}

export function ChipStack({ amount, size = 30, className = '' }: { amount: number; size?: number; className?: string }) {
  const chips = toChips(amount).reverse()
  if (!chips.length) return null
  const shown = chips.slice(-10)
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size + shown.length * 3 }} aria-label={`${amount} dollars in chips`}>
      {shown.map((v, i) => (
        <div key={i} className="absolute left-0" style={{ bottom: i * 3 }}>
          <Chip value={v} size={size} />
        </div>
      ))}
    </div>
  )
}

export function money(n: number, signed = false): string {
  const abs = Math.abs(n)
  const s = abs % 1 === 0 ? abs.toLocaleString('en-US') : abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (!signed) return (n < 0 ? '−$' : '$') + s
  return (n > 0 ? '+$' : n < 0 ? '−$' : '$') + s
}
