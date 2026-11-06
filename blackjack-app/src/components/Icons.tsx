import type { ReactElement, SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size = 20): SVGProps<SVGSVGElement> => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true })

const paths: Record<string, ReactElement> = {
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  play: <><rect x="4" y="4" width="10" height="14" rx="2" /><path d="M10 6h8a2 2 0 012 2v10a2 2 0 01-2 2h-6" /><path d="M8.5 10.5l1.5 2-1.5 2-1.5-2z" fill="currentColor" /></>,
  learn: <><path d="M3 6l9-3 9 3-9 3-9-3z" /><path d="M7 8v5c0 1.7 2.2 3 5 3s5-1.3 5-3V8" /><path d="M21 6v6" /></>,
  practice: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
  hand: <><path d="M8 13V5.5a1.5 1.5 0 013 0V11" /><path d="M11 10.5V4.5a1.5 1.5 0 013 0V11" /><path d="M14 11V6a1.5 1.5 0 013 0v7" /><path d="M8 12.5l-1.6-1.6a1.6 1.6 0 00-2.3 2.3L8 17.5c1.3 1.5 3 2.5 5 2.5h1a5 5 0 005-5v-2" /></>,
  strategy: <><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17M15 3.5v17" /></>,
  count: <><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  progress: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
  more: <><circle cx="5" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="19" cy="12" r="1.3" fill="currentColor" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  x: <><path d="M7 7l10 10M17 7L7 17" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  back: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
  book: <><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" /><path d="M4 19a2 2 0 012-2h13" /></>,
  cards: <><rect x="3" y="6" width="11" height="15" rx="2" /><path d="M8 3h11a2 2 0 012 2v12" /></>,
  flame: <><path d="M12 3s5 4.5 5 10a5 5 0 01-10 0c0-2.5 1.5-4 1.5-4s.5 2.5 2.5 2.5C11 9 12 3 12 3z" /></>,
  shield: <><path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  double: <><rect x="4" y="9" width="9" height="11" rx="1.5" /><rect x="11" y="4" width="9" height="11" rx="1.5" /></>,
  split: <><path d="M12 21v-7M12 14L6 6M12 14l6-8M4 6h4M16 6h4" /></>,
  flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  gem: <><path d="M6 3h12l3 6-9 12L3 9l3-6z" /><path d="M3 9h18M12 21L9 9l3-6 3 6-3 12" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  crown: <><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /></>,
  eye: <><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  divide: <><circle cx="12" cy="6" r="1.4" fill="currentColor" /><circle cx="12" cy="18" r="1.4" fill="currentColor" /><path d="M5 12h14" /></>,
  bolt: <><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  wrench: <><path d="M14.5 6.5a4 4 0 00-5.3 5.3L3.5 17.5 6.5 20.5l5.7-5.7a4 4 0 005.3-5.3l-2.4 2.4-2.6-.5-.5-2.6 2.5-2.3z" /></>,
  medal: <><circle cx="12" cy="15" r="5" /><path d="M8.5 11L6 3h4l2 5M15.5 11L18 3h-4l-2 5" /></>,
  lightbulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0012 3z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  reset: <><path d="M4 12a8 8 0 108-8 8.5 8.5 0 00-6 2.5L4 8" /><path d="M4 4v4h4" /></>,
  chat: <><path d="M4 5h16v11H9l-5 4V5z" /></>,
  cloud: <><path d="M7 18a4 4 0 01-.5-8A5.5 5.5 0 0117 8.5 4.5 4.5 0 0117.5 18H7z" /></>,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></>,
  star: <><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" /></>,
}

export type IconName = keyof typeof paths

export function Icon({ name, size, ...rest }: P & { name: string }) {
  return <svg {...base(size)} {...rest}>{paths[name] ?? paths.star}</svg>
}
