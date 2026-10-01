import { useCallback } from 'react';
import { emptyProfile, recordActivity } from '@/domain/profile';
import { useServices } from '@/app/providers/servicesContext';
import { dayKeyOf } from './days';
import { useStored } from './useStored';

export function useProfile() {
  const { profile } = useServices();
  return useStored(profile, emptyProfile);
}

/** Marks today as practised (once per day). Failures are logged, never shown as errors. */
export function useRecordActivity() {
  const { profile, clock } = useServices();
  return useCallback(() => {
    const today = dayKeyOf(clock.now());
    profile
      .get()
      .then((current) => profile.save(recordActivity(current ?? emptyProfile(), today)))
      .catch((error: unknown) => {
        console.error('[profile] Could not record activity', error);
      });
  }, [profile, clock]);
}
