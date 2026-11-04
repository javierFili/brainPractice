import { DAY_MS } from '@/domain/learning';

const formats = new Map<string, Intl.RelativeTimeFormat>();

/** "today", "tomorrow", "in 3 days" (in the reader's language) — by calendar distance in days. */
export function relativeDay(at: number, now: number, language: string): string {
  const days = Math.max(0, Math.ceil((at - now) / DAY_MS));
  let format = formats.get(language);
  if (!format) {
    format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    formats.set(language, format);
  }
  return format.format(days, 'day');
}
