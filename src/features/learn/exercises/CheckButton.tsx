import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export function CheckButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const { t } = useTranslation('learn');
  return (
    <div>
      <Button onClick={onClick} disabled={disabled}>
        {t('exercise.check')}
      </Button>
    </div>
  );
}
