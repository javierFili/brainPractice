import { useEffect, useState } from 'react';

/**
 * Index of the item being presented in a timed sequence: 0, 1, … every `stepMs`, then `count`
 * once the sequence is over. Restarts whenever `key` changes (a new challenge).
 */
export function useStepper(count: number, stepMs: number, running: boolean, key: string): number {
  const [state, setState] = useState({ key, index: 0 });
  const index = state.key === key ? state.index : 0;

  useEffect(() => {
    if (!running || index >= count) return undefined;
    const timer = setTimeout(() => {
      setState({ key, index: index + 1 });
    }, stepMs);
    return () => {
      clearTimeout(timer);
    };
  }, [running, index, count, stepMs, key]);

  return index;
}
