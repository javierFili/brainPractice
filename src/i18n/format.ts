import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Number, date and duration formats for one language, built on `Intl`. Only the language changes
 * them: the time zone stays the browser's and nothing here implies a country or a currency.
 */
export interface Formatter {
  readonly language: string;
  number(value: number, fractionDigits?: number): string;
  /** 0.853 → "85 %" (fr, de) / "85%" (en, es, it). */
  percent(ratio: number): string;
  /** Whole points with the language's thousands separator. */
  points(points: number): string;
  /** 850 ms, 1,25 s, 12,3 s; "—" for null. */
  ms(ms: number | null): string;
  /** Whole seconds ("12 s"); `noLimit` for null. */
  seconds(ms: number | null, noLimit: string): string;
  /** 12 min, 1 h 05 min. */
  duration(ms: number): string;
  /** 3 Oct 2026, 3 oct 2026, 3. Okt. 2026. */
  date(at: number): string;
  /** today, yesterday, 3 days ago — by elapsed whole days. */
  relativeDay(at: number, now: number): string;
}

const cache = new Map<string, Formatter>();

export function formatterFor(language: string): Formatter {
  const cached = cache.get(language);
  if (cached) return cached;
  const unit = (name: string, digits = 0) =>
    new Intl.NumberFormat(language, {
      style: 'unit',
      unit: name,
      unitDisplay: 'short',
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  const ms = unit('millisecond');
  const secondsShort = unit('second', 2);
  const secondsLong = unit('second', 1);
  const seconds = unit('second');
  const minutes = unit('minute');
  const hours = unit('hour');
  const percent = new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 });
  const points = new Intl.NumberFormat(language, { maximumFractionDigits: 0 });
  const date = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const relative = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const formatter: Formatter = {
    language,
    number: (value, fractionDigits) =>
      new Intl.NumberFormat(language, {
        maximumFractionDigits: fractionDigits ?? 2,
        ...(fractionDigits === undefined ? {} : { minimumFractionDigits: fractionDigits }),
      }).format(value),
    percent: (ratio) => percent.format(ratio),
    points: (value) => points.format(Math.round(value)),
    ms: (value) => {
      if (value === null) return '—';
      if (value < 1000) return ms.format(Math.round(value));
      return (value < 10_000 ? secondsShort : secondsLong).format(value / 1000);
    },
    seconds: (value, noLimit) =>
      value === null ? noLimit : seconds.format(Math.round(value / 1000)),
    duration: (value) => {
      const total = Math.round(value / 60_000);
      if (total < 60) return minutes.format(total);
      const rest = minutes.format(total % 60).replace(/^\d(?!\d)/, (digit) => `0${digit}`);
      return `${hours.format(Math.floor(total / 60))} ${rest}`;
    },
    date: (at) => date.format(new Date(at)),
    relativeDay: (at, now) =>
      relative.format(-Math.max(0, Math.floor((now - at) / 86_400_000)), 'day'),
  };
  cache.set(language, formatter);
  return formatter;
}

/** Formats for the current language; components using it re-render on a language switch. */
export function useFormat(): Formatter {
  const { i18n } = useTranslation();
  const { language } = i18n;
  return useMemo(() => formatterFor(language), [language]);
}
