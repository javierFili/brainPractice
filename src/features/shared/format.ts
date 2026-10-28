export const formatMs = (ms: number | null): string => {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
};

export const formatPercent = (ratio: number): string => `${Math.round(ratio * 100)}%`;

export const formatPoints = (points: number): string => Math.round(points).toLocaleString('en-US');

export const formatSeconds = (ms: number | null): string =>
  ms === null ? 'No limit' : `${Math.round(ms / 1000)} s`;

/** 0 min, 12 min, 1 h 05 min. */
export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${String(minutes % 60).padStart(2, '0')} min`;
}

/** "today", "yesterday", "3 days ago" — by elapsed time, which is enough for display. */
export function relativeDay(at: number, now: number): string {
  const days = Math.floor((now - at) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export const formatDate = (at: number): string =>
  new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
