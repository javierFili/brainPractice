import type { DayKey } from '@/domain/profile';

/** The learner's local calendar day; the only place local time zones enter the app. */
export function dayKeyOf(epochMs: number): DayKey {
  const date = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
