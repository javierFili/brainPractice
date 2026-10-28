import { MultiSelectBoard, ObjectFace } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { objectById } from '../../shared/content';
import type { ObjectRecallChallenge } from '../content/types';

export function ObjectRecallView({
  challenge,
  phase,
  respond,
  answer,
}: ContentViewProps<ObjectRecallChallenge>) {
  const { studied, board, columns } = challenge.content;
  const { response } = challenge;
  if (response.format !== 'multi-select') throw new Error('Object Recall uses multi-select');
  if (phase === 'study') {
    return (
      <ul
        aria-label="Objects to remember"
        className="mx-auto flex max-w-xl flex-wrap justify-center gap-2 sm:gap-3"
      >
        {studied.map((id) => {
          const item = objectById(id);
          return (
            <li
              key={id}
              className="flex h-20 w-20 items-center justify-center rounded-xl border border-line bg-raised sm:h-24 sm:w-24"
            >
              <ObjectFace item={item} showName className="text-3xl sm:text-4xl" />
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <MultiSelectBoard
      response={response}
      label="Objects you saw"
      columns={columns}
      size={board.length > 12 ? 'sm' : 'md'}
      respond={respond}
      answer={answer}
      cells={board.map((id) => {
        const item = objectById(id);
        return {
          key: id,
          label: item.name,
          content: <ObjectFace item={item} showName className="text-2xl sm:text-3xl" />,
        };
      })}
    />
  );
}
