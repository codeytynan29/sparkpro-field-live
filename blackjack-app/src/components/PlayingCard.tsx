import { memo, type CSSProperties } from 'react'
import { cardName, isRed, SUIT_SYMBOL, type Card } from '../engine/cards'

const PIPS: Record<string, [number, number][]> = {
  '2': [[50, 30], [50, 110]],
  '3': [[50, 30], [50, 70], [50, 110]],
  '4': [[31, 30], [69, 30], [31, 110], [69, 110]],
  '5': [[31, 30], [69, 30], [50, 70], [31, 110], [69, 110]],
  '6': [[31, 30], [69, 30], [31, 70], [69, 70], [31, 110], [69, 110]],
  '7': [[31, 30], [69, 30], [50, 50], [31, 70], [69, 70], [31, 110], [69, 110]],
  '8': [[31, 30], [69, 30], [50, 50], [31, 70], [69, 70], [50, 90], [31, 110], [69, 110]],
  '9': [[31, 28], [69, 28], [31, 56], [69, 56], [50, 70], [31, 84], [69, 84], [31, 112], [69, 112]],
  '10': [[31, 28], [69, 28], [50, 42], [31, 56], [69, 56], [31, 84], [69, 84], [50, 98], [31, 112], [69, 112]],
}

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
const SIZE: Record<CardSize, string> = {
  xs: 'w-8 h-[45px]',
  sm: 'w-11 h-[62px]',
  md: 'w-[54px] h-[76px] sm:w-16 sm:h-[90px]',
  lg: 'w-[64px] h-[90px] sm:w-[84px] sm:h-[118px]',
  xl: 'w-24 h-[134px] sm:w-28 sm:h-[157px]',
}

function Face({ card }: { card: Card }) {
  const color = isRed(card) ? '#b3261e' : '#15171a'
  const sym = SUIT_SYMBOL[card.suit]
  const face = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K'
  const ten = card.rank === '10'
  return (
    <svg viewBox="0 0 100 140" className="h-full w-full" aria-hidden="true">
      <g fill={color} fontFamily="'Playfair Display', Georgia, serif" fontWeight="700">
        <text x="12" y="23" fontSize={ten ? 18 : 22} textAnchor="middle" letterSpacing={ten ? -1.5 : 0}>{card.rank}</text>
        <text x="12" y="40" fontSize="16" textAnchor="middle">{sym}</text>
        <g transform="rotate(180 50 70)">
          <text x="12" y="23" fontSize={ten ? 18 : 22} textAnchor="middle" letterSpacing={ten ? -1.5 : 0}>{card.rank}</text>
          <text x="12" y="40" fontSize="16" textAnchor="middle">{sym}</text>
        </g>
        {card.rank === 'A' && (
          <>
            <circle cx="50" cy="70" r="27" fill="none" stroke="#c9a24a" strokeWidth="1.2" opacity=".8" />
            <text x="50" y="88" fontSize="52" textAnchor="middle">{sym}</text>
          </>
        )}
        {PIPS[card.rank]?.map(([x, y], i) => (
          <text key={i} x={x} y={y + 7} fontSize="22" textAnchor="middle" transform={y > 72 ? `rotate(180 ${x} ${y})` : undefined}>{sym}</text>
        ))}
        {face && (
          <>
            <rect x="22" y="22" width="56" height="96" rx="5" fill="none" stroke="#c9a24a" strokeWidth="1.4" />
            <rect x="25" y="25" width="50" height="90" rx="4" fill={isRed(card) ? 'rgba(179,38,30,.06)' : 'rgba(21,23,26,.05)'} stroke="#c9a24a" strokeWidth=".6" opacity=".9" />
            <path d="M36 46 l5 -10 l5 7 l4 -10 l4 10 l5 -7 l5 10 z" fill="#c9a24a" opacity={card.rank === 'J' ? 0.55 : 0.9} />
            <text x="50" y="88" fontSize="40" textAnchor="middle">{card.rank}</text>
            <text x="50" y="108" fontSize="14" textAnchor="middle">{sym}</text>
          </>
        )}
      </g>
    </svg>
  )
}

function Back() {
  return (
    <svg viewBox="0 0 100 140" className="h-full w-full" aria-hidden="true">
      <rect x="7" y="7" width="86" height="126" rx="6" fill="none" stroke="#d4a63b" strokeOpacity=".7" strokeWidth="1.2" />
      <g transform="translate(50 70)" fill="none" stroke="#ead28c" strokeOpacity=".8">
        <circle r="16" strokeWidth="1.4" />
        <path d="M0 -10 L8 0 L0 10 L-8 0 Z" fill="#d4a63b" fillOpacity=".55" strokeWidth=".8" />
      </g>
    </svg>
  )
}

export interface PlayingCardProps {
  card?: Card | null
  faceDown?: boolean
  size?: CardSize
  className?: string
  /** Animate in from the shoe; delay in ms. */
  dealDelay?: number | null
  style?: CSSProperties
  dim?: boolean
}

export const PlayingCard = memo(function PlayingCard({ card, faceDown, size = 'md', className = '', dealDelay, style, dim }: PlayingCardProps) {
  const hidden = faceDown || !card
  const animStyle: CSSProperties = dealDelay != null ? { animationDelay: `${dealDelay}ms` } : {}
  return (
    <div
      className={`relative shrink-0 [perspective:600px] ${SIZE[size]} ${dealDelay != null ? 'deal-in' : ''} ${hidden ? 'flipped' : ''} ${dim ? 'opacity-60' : ''} ${className}`}
      style={{ ...animStyle, ...style }}
      role="img"
      aria-label={hidden ? 'Face-down card' : cardName(card!)}
    >
      <div className="pcard-inner relative h-full w-full">
        <div className="pcard pcard-face overflow-hidden">{card && <Face card={card} />}</div>
        <div className="pcard pcard-back pcard-backface overflow-hidden"><Back /></div>
      </div>
    </div>
  )
})

export function CardRow({ cards, size = 'sm', overlap = false, className = '' }: { cards: Card[]; size?: CardSize; overlap?: boolean; className?: string }) {
  return (
    <div className={`flex ${overlap ? '-space-x-5' : 'gap-1.5'} ${className}`}>
      {cards.map((c, i) => <PlayingCard key={i} card={c} size={size} />)}
    </div>
  )
}
