import { useEffect } from 'react';
import { responseDeadline, studyDeadline, type SessionState } from '@/domain/session';
import type { Clock } from '@/domain/time/Clock';
import type { GameSession } from '@/engine';

const afterPaint = (callback: () => void): (() => void) => {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(() => {
      callback();
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }
  const id = setTimeout(callback, 0);
  return () => {
    clearTimeout(id);
  };
};

/**
 * Drives time-based transitions. Timers only *request* transitions; the session decides using the
 * clock, so a late or early timer can never produce a wrong outcome.
 */
export function useSessionLifecycle(session: GameSession, state: SessionState, clock: Clock): void {
  const { status, index } = state;

  // Start measuring only once the challenge has actually been painted.
  useEffect(() => {
    if (status !== 'presenting') return undefined;
    return afterPaint(() => {
      session.present();
    });
  }, [session, status, index]);

  useEffect(() => {
    const deadline =
      status === 'studying'
        ? studyDeadline(state)
        : status === 'responding'
          ? responseDeadline(state)
          : null;
    if (deadline === null) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (ms: number) => {
      timer = setTimeout(
        () => {
          if (status === 'studying') {
            session.endStudy();
            return;
          }
          const result = session.expire();
          if (!result.ok && result.error.code === 'NOT_EXPIRED') schedule(result.error.remainingMs);
        },
        Math.max(0, ms),
      );
    };
    schedule(deadline - clock.now());
    return () => {
      clearTimeout(timer);
    };
  }, [session, state, status, clock]);
}
