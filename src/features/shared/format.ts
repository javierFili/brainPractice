export const formatMs = (ms: number | null): string => {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
};

export const formatPercent = (ratio: number): string => `${Math.round(ratio * 100)}%`;

export const formatPoints = (points: number): string => Math.round(points).toLocaleString('en-US');

export const formatSeconds = (ms: number | null): string =>
  ms === null ? 'No limit' : `${Math.round(ms / 1000)} s`;
