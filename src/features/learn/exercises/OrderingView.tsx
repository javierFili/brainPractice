import { useState } from 'react';
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
  const [order, setOrder] = useState(() => stableShuffle(exercise.items, exercise.id));
  return (
    <div className="flex flex-col gap-4">
      <ReorderList
        items={order}
        locked={locked}
        label="Your order"
        onMove={(i, d) => {
          setOrder((o) => moveItem(o, i, d));
        }}
      />
      {showSolution && (
        <p className="text-sm text-emerald-300">
          Correct order: {exercise.items.map((i) => plainText(i.label).trim()).join(' → ')}
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
