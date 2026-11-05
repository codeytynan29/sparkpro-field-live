import type { Action } from '../engine/strategy'

/** Animated line-art demonstrations of table hand signals. */
export function HandSignal({ action, faceDown = false, size = 180, animate = true }: { action: Action; faceDown?: boolean; size?: number; animate?: boolean }) {
  const a = (cls: string) => (animate ? cls : '')
  const hand = '#f3ead3'
  const card = (x: number, y: number, r = 0, down = false) => (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect width="26" height="36" rx="3" fill={down ? '#135a3d' : '#fffdf7'} stroke={down ? '#f3ead3' : '#c9a24a'} strokeWidth="1.2" />
      {!down && <text x="5" y="11" fontSize="9" fontWeight="700" fill="#15171a" fontFamily="Georgia">K</text>}
      {down && <path d="M6 8l14 20M20 8L6 28" stroke="#d4a63b" strokeOpacity=".5" />}
    </g>
  )
  const chips = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="6" rx="12" ry="5" fill="#0a3524" />
      <ellipse cx="0" cy="3" rx="12" ry="5" fill="#b5262e" stroke="#f3ead3" strokeWidth="1" />
      <ellipse cx="0" cy="0" rx="12" ry="5" fill="#b5262e" stroke="#f3ead3" strokeWidth="1" strokeDasharray="3 2" />
    </g>
  )
  const flatHand = (
    <g>
      <path d="M0 0 q20 -8 46 -4 q10 2 12 8 q-2 6 -12 7 q-26 3 -46 -2 z" fill={hand} stroke="#b98b26" strokeWidth="1.2" />
      <path d="M44 -3 h18 M45 2 h20 M44 7 h17" stroke="#b98b26" strokeWidth="1" />
    </g>
  )
  const pointHand = (fingers: 1 | 2) => (
    <g>
      <path d="M0 30 q-2 -16 8 -22 l14 -2 q10 2 10 14 l-2 16 z" fill={hand} stroke="#b98b26" strokeWidth="1.2" />
      <rect x="10" y="-14" width="7" height="24" rx="3.5" fill={hand} stroke="#b98b26" strokeWidth="1.2" transform={fingers === 2 ? 'rotate(-12 13 8)' : undefined} />
      {fingers === 2 && <rect x="18" y="-13" width="7" height="24" rx="3.5" fill={hand} stroke="#b98b26" strokeWidth="1.2" transform="rotate(12 21 8)" />}
    </g>
  )
  return (
    <svg viewBox="0 0 200 140" width={size} height={(size * 140) / 200} role="img" aria-label={`${action} signal, ${faceDown ? 'face-down game' : 'face-up game'}`}>
      <rect x="2" y="2" width="196" height="136" rx="14" fill="#0e4630" stroke="#d4a63b" strokeOpacity=".35" />
      <ellipse cx="100" cy="112" rx="30" ry="12" fill="none" stroke="#d4a63b" strokeOpacity=".5" strokeDasharray="3 3" />
      {/* bet */}
      {!(faceDown && action === 'stand') && chips(100, 106)}
      {/* cards */}
      {!faceDown && (
        <g>
          {card(76, 48, -6)}
          {card(98, 46, 6)}
        </g>
      )}
      {faceDown && action === 'hit' && (
        <g className={a('anim-scratch')}>
          {card(84, 62, -4, true)}
          {card(92, 60, 4, true)}
          <path d="M70 102 q20 -14 52 -6" stroke={hand} strokeWidth="9" strokeLinecap="round" fill="none" />
        </g>
      )}
      {faceDown && action === 'stand' && (
        <g>
          <g className={a('anim-slide')}>
            {card(88, 82, 90, true)}
          </g>
          {chips(100, 100)}
        </g>
      )}
      {faceDown && (action === 'double' || action === 'split' || action === 'surrender') && (
        <g>
          {card(76, 48, -6)}
          {card(98, 46, 6)}
        </g>
      )}
      {/* gestures */}
      {!faceDown && action === 'hit' && (
        <g transform="translate(132 54)">
          <g className={a('anim-tap')}>{pointHand(1)}</g>
          <path d="M126 96 h20" transform="translate(-132 -54)" stroke="#ead28c" strokeOpacity=".6" strokeWidth="2" strokeDasharray="2 3" />
        </g>
      )}
      {!faceDown && action === 'stand' && (
        <g transform="translate(70 26)">
          <g className={a('anim-wave')}>{flatHand}</g>
        </g>
      )}
      {(action === 'double' || action === 'split') && (
        <g>
          {chips(140, 106)}
          {action === 'split' && chips(140, 100)}
          <g transform="translate(150 44)">{pointHand(action === 'double' ? 1 : 2)}</g>
        </g>
      )}
      {action === 'surrender' && (
        <g>
          <path d="M66 130 L134 130" stroke="#ead28c" strokeWidth="3" strokeLinecap="round" className={a('anim-line')} />
          <g transform="translate(138 92)"><g className={a('anim-wave')}>{pointHand(1)}</g></g>
          <text x="12" y="24" fontSize="12" fill="#ead28c" fontFamily="Inter Variable, sans-serif" fontWeight="600">“Surrender.”</text>
        </g>
      )}
    </svg>
  )
}
