import { DAY_MS } from '@/domain/learning';

/** "today", "tomorrow", "in 3 days" — relative to now, by calendar distance in days. */
export function relativeDay(at: number, now: number): string {
  const days = Math.ceil((at - now) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}
