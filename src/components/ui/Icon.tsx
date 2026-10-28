/**
 * A small stroke icon set (24×24, 1.75 stroke) drawn inline, so the app needs no icon dependency.
 * Icons are decorative by default: the visible or screen-reader label carries the meaning.
 */
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5',
  play: 'M7 4.5v15l12-7.5Z',
  calendar: 'M4 6.5h16v13H4Zm0 4h16M8.5 3.5v5m7-5v5',
  chart: 'M4 20h16M7 16v-5m5 5V7m5 9v-8',
  grid: 'M4 4h7v7H4Zm9 0h7v7h-7ZM4 13h7v7H4Zm9 0h7v7h-7Z',
  memory:
    'M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3.2 3.2 0 0 0 8.5 18a2.5 2.5 0 0 0 3.5 1.5V5.5A2.6 2.6 0 0 0 9 4.5Zm6 0a3 3 0 0 1 3 3 3 3 0 0 1 2 5.2 3.2 3.2 0 0 1-4.5 5.3A2.5 2.5 0 0 1 12 19.5',
  logic:
    'M8 4h5a2 2 0 0 1 2 2v1.5a1.5 1.5 0 1 0 3 0V7h2v5h-1.5a1.5 1.5 0 1 0 0 3H20v5h-5v-1.5a1.5 1.5 0 1 0-3 0V20H4v-5h1.5a1.5 1.5 0 1 0 0-3H4V6a2 2 0 0 1 2-2Z',
  speed: 'M13 3 5 13.5h6L10 21l9-11.5h-6Z',
  attention:
    'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  patterns: 'M12 3.5 15 9H9Zm-6 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.5 0h6v6h-6Z',
  spatial: 'M12 3 20 7.5v9L12 21l-8-4.5v-9Zm0 0v9m0 0 8-4.5M12 12 4 7.5',
  focus:
    'M12 3v3m0 12v3M3 12h3m12 0h3m-9 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-3.2a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z',
  timer: 'M12 21a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm0-11v4l2.5 2M9.5 2.5h5',
  kids: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z',
  teens:
    'M13.5 4.5c3 0 5.5 1 6 1.5.5.5 1.5 3 1.5 6l-7 7-6-6Zm-6.5 9-3 1 1.5 3m3-1.5L6 21m11-11.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  adults: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 10a7.5 7.5 0 0 1 15 0',
  seniors:
    'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4L17 7M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z',
  code: 'm8.5 7-5 5 5 5m7-10 5 5-5 5M13.5 4l-3 16',
  assessment: 'M9 4h6v3H9Zm-3 1.5H5v15h14v-15h-1M8.5 12.5l2 2 4.5-4.5',
  history: 'M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5m0-4v4h4M12 8v4.5l3 2',
  profile: 'M12 3.5 20 9l-3 9.5H7L4 9Zm0 4.5-3.5 2.5 1.5 4.5h4l1.5-4.5Z',
  learn:
    'M3.5 5.5h6a2.5 2.5 0 0 1 2.5 2.5v12a2 2 0 0 0-2-2H3.5Zm17 0h-6A2.5 2.5 0 0 0 12 8v12a2 2 0 0 1 2-2h6.5Z',
  flow: 'M4 4h6v5H4Zm10 11h6v5h-6ZM7 9v3.5a2.5 2.5 0 0 0 2.5 2.5H14M14 7h3a3 3 0 0 1 3 3v5',
  puzzle: 'M5 5h14v14H5Zm4.5 0v14M14.5 5v14M5 9.5h14M5 14.5h14',
  settings: 'M4 7h9m4 0h3M4 17h3m4 0h9M15 4.5v5M9 14.5v5',
  accessibility: 'M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 9l7 1.5L19 9m-7 1.5V15m0 0-3 6m3-6 3 6',
  reset: 'M4 12a8 8 0 1 0 2.4-5.7L4 8.5m0-5v5h5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'm6 6 12 12M18 6 6 18',
  chevronLeft: 'm14.5 6-6 6 6 6',
  chevronRight: 'm9.5 6 6 6-6 6',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  lock: 'M6 11h12v9H6Zm2.5 0V8a3.5 3.5 0 0 1 7 0v3',
  sparkle: 'M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2Z',
  trophy:
    'M8 4h8v5a4 4 0 0 1-8 0Zm0 1.5H4.5A3.5 3.5 0 0 0 8 10m8-4.5h3.5A3.5 3.5 0 0 1 16 10m-4 3v4m-3.5 3h7',
  search: 'M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20.5 20.5l-5-5',
  arrowRight: 'M4.5 12h14m-5-5 5 5-5 5',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = 'h-5 w-5',
  label,
}: {
  readonly name: IconName;
  readonly className?: string;
  /** Only for icons that stand alone without visible text. */
  readonly label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
