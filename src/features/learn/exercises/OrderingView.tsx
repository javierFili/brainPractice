import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { joinText } from '@/domain/shared';
import { useText } from '@/i18n';
import { plainText } from '../text';
import { stableShuffle } from '../shuffle';
import { CheckButton } from './CheckButton';
import { moveItem } from './moveItem';
import { ReorderList } from './ReorderList';
import type { ExerciseViewProps } from './types';

export function OrderingView({
  exercise,
  locked,
  showSolution,
  onSubmit,
}: ExerciseViewProps<'ordering'>) {
  const { t } = useTranslation('learn');
  const tx = useText();
  const [order, setOrder] = useState(() => stableShuffle(exercise.items, exercise.id));
  return (
    <div className="flex flex-col gap-4">
      <ReorderList
        items={order}
        locked={locked}
        label={t('exercise.yourOrder')}
        onMove={(i, d) => {
          setOrder((o) => moveItem(o, i, d));
        }}
      />
      {showSolution && (
        <p className="text-sm text-emerald-300">
          {t('exercise.correctOrder', {
            order: plainText(
              tx(
                joinText(
                  exercise.items.map((i) => i.label),
                  ' → ',
                ),
              ),
            ),
          })}
        </p>
      )}
      {!locked && (
        <CheckButton
          disabled={false}
          onClick={() => {
            onSubmit({ kind: 'ordering', order: order.map((i) => i.id) });
          }}
        />
      )}
    </div>
  );
}
