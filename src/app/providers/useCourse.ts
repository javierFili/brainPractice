import { use } from 'react';
import type { Course } from '@/domain/learning';
import { useServices } from './servicesContext';

/** The curriculum; suspends until its chunk has loaded the first time. */
export function useCourse(): Course {
  return use(useServices().loadCourse());
}
