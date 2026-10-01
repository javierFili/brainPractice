import { useState } from 'react';
import type { ChoiceOption } from '@/domain/challenge';
import { Button } from '@/components/ui/Button';
import { plainText } from '../text';
import { stableShuffle } from '../shuffle';
import { CheckButton } from './CheckButton';
import { moveItem } from './moveItem';
import { ReorderList } from './ReorderList';
import type { ExerciseViewProps } from './types';

/** Algorithm Builder: pick the blocks that solve the problem and put them in order. */
export function BlockBuilderView({
  exercise,
  locked,
  showSolution,
  onSubmit,
}: ExerciseViewProps<'block-builder'>) {
  const [palette] = useState(() => stableShuffle(exercise.blocks, exercise.id));
  const [chosen, setChosen] = useState<ChoiceOption[]>([]);
  const available = palette.filter((b) => !chosen.some((c) => c.id === b.id));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section aria-labelledby={`${exercise.id}-palette`} className="flex flex-col gap-2">
        <h3
          id={`${exercise.id}-palette`}
          className="text-xs font-semibold tracking-widest text-slate-400 uppercase"
        >
          Blocks
        </h3>
        <ul className="flex flex-col gap-2">
          {available.map((block) => (
            <li key={block.id}>
              <Button
                variant="secondary"
                disabled={locked}
                className="w-full justify-start font-mono whitespace-pre-wrap"
                aria-label={`Add ${plainText(block.label).trim()}`}
                onClick={() => {
                  setChosen((c) => [...c, block]);
                }}
              >
                <span aria-hidden="true">+</span> {plainText(block.label)}
              </Button>
            </li>
          ))}
          {available.length === 0 && <li className="text-sm text-slate-500">All blocks used.</li>}
        </ul>
      </section>
      <section aria-labelledby={`${exercise.id}-program`} className="flex flex-col gap-2">
        <h3
          id={`${exercise.id}-program`}
          className="text-xs font-semibold tracking-widest text-slate-400 uppercase"
        >
          Your algorithm
        </h3>
        {chosen.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
            Add blocks from the list, then order them.
          </p>
        ) : (
          <ReorderList
            items={chosen}
            locked={locked}
            label="Your algorithm"
            onMove={(i, d) => {
              setChosen((c) => moveItem(c, i, d));
            }}
            onRemove={(i) => {
              setChosen((c) => c.filter((_, j) => j !== i));
            }}
          />
        )}
        {showSolution && (
          <p className="text-sm text-emerald-300">
            Solution:{' '}
            {exercise.solution
              .map((id) => plainText(exercise.blocks.find((b) => b.id === id)?.label ?? id).trim())
              .join(' → ')}
          </p>
        )}
        {!locked && (
          <CheckButton
            disabled={chosen.length === 0}
            onClick={() => {
              onSubmit({ kind: 'block-builder', order: chosen.map((c) => c.id) });
            }}
          />
        )}
      </section>
    </div>
  );
}
