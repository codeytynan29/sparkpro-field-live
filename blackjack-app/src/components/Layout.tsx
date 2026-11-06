import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useProgress } from '../state/store'
import { Icon } from './Icons'
import { Logo, Sheet } from './ui'
import { levelFor, rankFor } from '../state/progress'
import { ReferenceDrawer } from './ReferenceDrawer'

export const NAV = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/play', label: 'Play Blackjack', short: 'Play', icon: 'play' },
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/etiquette', label: 'Casino Etiquette', short: 'Etiquette', icon: 'hand' },
  { to: '/strategy', label: 'Strategy', icon: 'strategy' },
  { to: '/counting', label: 'Card Counting', short: 'Counting', icon: 'count' },
  { to: '/progress', label: 'My Progress', short: 'Progress', icon: 'progress' },
] as const

const MOBILE_PRIMARY = ['/', '/play', '/learn', '/practice']

export function Layout({ children }: { children: ReactNode }) {
  const p = useProgress()
  const [more, setMore] = useState(false)
  const [refOpen, setRefOpen] = useState(false)
  const loc = useLocation()
  const lv = levelFor(p.xp)
  useEffect(() => {
    setMore(false)
    window.scrollTo({ top: 0 })
  }, [loc.pathname])
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', p.settings.reduceMotion)
  }, [p.settings.reduceMotion])
  const inMore = !MOBILE_PRIMARY.includes(loc.pathname) && !loc.pathname.startsWith('/learn/')

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 btn-gold">Skip to content</a>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gold-400/10 bg-ink-950/70 px-4 py-6 lg:flex">
        <NavLink to="/" className="px-2"><Logo /></NavLink>
        <nav className="mt-8 flex flex-col gap-0.5" aria-label="Main">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-gold-400/12 text-gold-100 shadow-[inset_0_0_0_1px_rgba(212,166,59,.28)]' : 'text-cream-200/70 hover:bg-white/5 hover:text-cream-50'}`}
            >
              <Icon name={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <button className="btn-ghost w-full" onClick={() => setRefOpen(true)}><Icon name="book" size={16} /> Reference</button>
          <NavLink to="/settings" className="btn-quiet w-full justify-start"><Icon name="settings" size={16} /> Settings</NavLink>
          <div className="panel-soft px-3 py-2.5 text-xs text-cream-300/70">
            <div className="font-semibold text-cream-100">{rankFor(lv.level).title}</div>
            Level {lv.level} · {p.xp.toLocaleString()} XP
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile header */}
        <header className="safe-top sticky top-0 z-30 border-b border-gold-400/10 bg-ink-950/95 lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <NavLink to="/" aria-label="Home"><Logo /></NavLink>
            <div className="flex items-center gap-1">
              <button className="btn-quiet px-2.5" onClick={() => setRefOpen(true)} aria-label="Open reference"><Icon name="book" /></button>
              <NavLink to="/settings" className="btn-quiet px-2.5" aria-label="Settings"><Icon name="settings" /></NavLink>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>

        {/* Mobile tab bar */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-gold-400/15 bg-ink-950/95 lg:hidden" aria-label="Main">
          <div className="grid grid-cols-5">
            {NAV.filter((n) => MOBILE_PRIMARY.includes(n.to)).map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium ${isActive ? 'text-gold-200' : 'text-cream-300/60'}`}>
                <Icon name={n.icon} size={22} />
                {'short' in n ? n.short : n.label}
              </NavLink>
            ))}
            <button onClick={() => setMore(true)} className={`flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium ${inMore ? 'text-gold-200' : 'text-cream-300/60'}`} aria-haspopup="dialog">
              <Icon name="more" size={22} />
              More
            </button>
          </div>
        </nav>
      </div>

      <Sheet open={more} onClose={() => setMore(false)} title="More">
        <div className="grid grid-cols-2 gap-2">
          {NAV.filter((n) => !MOBILE_PRIMARY.includes(n.to)).map((n) => (
            <NavLink key={n.to} to={n.to} className="panel-soft flex items-center gap-3 px-4 py-4 text-sm font-medium text-cream-100">
              <span className="text-gold-300"><Icon name={n.icon} /></span>
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/settings" className="panel-soft flex items-center gap-3 px-4 py-4 text-sm font-medium text-cream-100">
            <span className="text-gold-300"><Icon name="settings" /></span>
            Settings
          </NavLink>
          <button onClick={() => { setMore(false); setRefOpen(true) }} className="panel-soft flex items-center gap-3 px-4 py-4 text-left text-sm font-medium text-cream-100">
            <span className="text-gold-300"><Icon name="book" /></span>
            Reference
          </button>
        </div>
      </Sheet>
      <ReferenceDrawer open={refOpen} onClose={() => setRefOpen(false)} />
    </div>
  )
}
