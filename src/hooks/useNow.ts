import { useEffect, useState } from 'react';
import type { Clock } from '@/domain/time/Clock';

/** Re-renders with the current clock time every `intervalMs` while `active`. */
export function useNow(clock: Clock, active: boolean, intervalMs = 100): number {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      setNow(clock.now());
    }, intervalMs);
    return () => {
      clearInterval(id);
    };
  }, [active, clock, intervalMs]);
  return now;
}
