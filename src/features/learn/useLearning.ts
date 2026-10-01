import { emptyLearningProgress } from '@/domain/learning';
import { useServices } from '@/app/providers/servicesContext';
import { useStored } from '@/features/shared/useStored';

export function useLearning() {
  const { learning } = useServices();
  return useStored(learning, emptyLearningProgress);
}
