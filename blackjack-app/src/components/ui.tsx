import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icons'

/** Renders **bold** and *italic* inline markup from lesson text. */
export function Rich({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith('**') ? <strong key={i} className="font-semibold text-cream-50">{p.slice(2, -2)}</strong>
          : p.startsWith('*') && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em>
            : <span key={i}>{p}</span>,
      )}
    </span>
  )
}

export function PageHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="label mb-1">{eyebrow}</div>}
        <h1 className="text-[28px] font-semibold leading-tight text-cream-50 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-cream-200/70 sm:text-base">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function ProgressBar({ value, className = '', tone = 'gold' }: { value: number; className?: string; tone?: 'gold' | 'felt' | 'ruby' }) {
  const color = tone === 'gold' ? 'from-gold-200 to-gold-500' : tone === 'felt' ? 'from-emerald-300 to-felt-500' : 'from-ruby-400 to-ruby-600'
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-white/10 ${className}`} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 6, label, sub }: { value: number | null; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = value ?? 0
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.08)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#ringgold)" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - v)} strokeLinecap="round" className="transition-all duration-700" />
        <defs>
          <linearGradient id="ringgold" x1="0" x2="1">
            <stop offset="0" stopColor="#ead28c" />
            <stop offset="1" stopColor="#b98b26" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-sm font-bold text-cream-50">{label ?? (value == null ? '—' : `${Math.round(v * 100)}%`)}</span>
        {sub && <span className="mt-0.5 text-[9px] uppercase tracking-wider text-cream-300/60">{sub}</span>}
      </div>
    </div>
  )
}

export function Stat({ label, value, hint, className = '' }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={`panel-soft p-3.5 ${className}`}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-cream-300/60">{label}</div>
      <div className="mt-1 text-xl font-semibold text-cream-50">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-cream-300/60">{hint}</div>}
    </div>
  )
}

export function Sheet({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={`panel fade-up relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-b-none outline-none sm:rounded-2xl ${wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
          <h2 className="text-lg font-semibold text-cream-50">{title}</h2>
          <button className="btn-quiet -mr-2 px-2" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4 safe-bottom">{children}</div>
      </div>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, className = '' }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void; className?: string }) {
  return (
    <div className={`no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-white/5 bg-ink-900/70 p-1 ${className}`} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${value === t.id ? 'bg-gold-400/15 text-gold-100 shadow-[inset_0_0_0_1px_rgba(212,166,59,.35)]' : 'text-cream-300/70 hover:text-cream-100'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="panel-soft flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="font-display text-lg text-cream-50">{title}</div>
      {body && <p className="max-w-sm text-sm text-cream-300/70">{body}</p>}
      {action}
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-medium text-cream-100">{label}</span>
        {hint && <span className="block text-xs text-cream-300/60">{hint}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-white/10 transition peer-checked:bg-gold-400/80 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-300" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-cream-100 shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

export function DealerAvatar({ size = 44, mood = 'neutral' }: { size?: number; mood?: 'neutral' | 'happy' | 'concerned' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="dav" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a704c" />
          <stop offset="1" stopColor="#062419" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill="url(#dav)" stroke="#d4a63b" strokeWidth="1.5" />
      <path d="M10 44c2-8 7-11 14-11s12 3 14 11" fill="#0d0f12" />
      <path d="M20 33l4 5 4-5" fill="#f3ead3" />
      <path d="M22.5 36.5h3l-1.5 3z" fill="#9d2a3c" />
      <circle cx="24" cy="21" r="8.5" fill="#d9b48f" />
      <path d="M15.5 19c.5-5 4-7.5 8.5-7.5s8 2.5 8.5 7.5c-2-2.5-5.5-3.5-8.5-3.5S17.5 16.5 15.5 19z" fill="#2c2018" />
      <circle cx="21" cy="21" r="1" fill="#1a1a1a" />
      <circle cx="27" cy="21" r="1" fill="#1a1a1a" />
      {mood === 'happy' && <path d="M20.5 24.5c2 2 5 2 7 0" stroke="#5a3a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />}
      {mood === 'neutral' && <path d="M21 25h6" stroke="#5a3a2a" strokeWidth="1.3" strokeLinecap="round" />}
      {mood === 'concerned' && <path d="M21 26c2-1.5 4-1.5 6 0" stroke="#5a3a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />}
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="10" y="7" width="22" height="31" rx="3" transform="rotate(-12 21 22)" fill="#f3ead3" stroke="#b98b26" />
        <rect x="16" y="9" width="22" height="31" rx="3" transform="rotate(8 27 24)" fill="#fffdf7" stroke="#d4a63b" />
        <text x="27.5" y="31" textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight="700" fontSize="15" fill="#15171a" transform="rotate(8 27 24)">A</text>
        <text x="27.5" y="20" textAnchor="middle" fontSize="8" fill="#15171a" transform="rotate(8 27 24)">♠</text>
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-semibold tracking-wide text-cream-50">BLACKJACK</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-300">The Table</div>
        </div>
      )}
    </div>
  )
}
