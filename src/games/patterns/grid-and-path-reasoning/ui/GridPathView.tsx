import type { ContentViewProps } from '@/games/types';
import { listWords } from '../../shared/content';
import type { GridPathChallenge, GridPathContent } from '../content/types';

type Role =
  | { readonly type: 'open' }
  | { readonly type: 'wall' }
  | { readonly type: 'start' }
  | { readonly type: 'goal' }
  | { readonly type: 'exit'; readonly letter: string }
  | { readonly type: 'mark'; readonly number: number };

function roleOf(content: GridPathContent, cell: number): Role {
  if (content.walls.includes(cell)) return { type: 'wall' };
  if (cell === content.start) return { type: 'start' };
  if (cell === content.goal) return { type: 'goal' };
  const exit = content.exits.indexOf(cell);
  if (exit !== -1) return { type: 'exit', letter: String.fromCharCode(65 + exit) };
  const mark = content.marks.indexOf(cell);
  if (mark !== -1) return { type: 'mark', number: mark + 1 };
  return { type: 'open' };
}

const roleWords = (role: Role) => {
  switch (role.type) {
    case 'open':
      return 'open';
    case 'wall':
      return 'wall';
    case 'start':
      return 'turtle (start)';
    case 'goal':
      return 'star (goal)';
    case 'exit':
      return `exit ${role.letter}`;
    case 'mark':
      return `cell ${role.number}`;
  }
};

/** "Row 2: walls at columns 1 and 4; exit A at column 6" — open squares are not listed. */
function rowWords(content: GridPathContent, r: number) {
  const { size } = content;
  const groups = new Map<string, number[]>();
  for (let c = 0; c < size; c++) {
    const role = roleOf(content, r * size + c);
    if (role.type === 'open') continue;
    const words = roleWords(role);
    groups.set(words, [...(groups.get(words) ?? []), c + 1]);
  }
  if (groups.size === 0) return `Row ${r + 1}: all open`;
  const parts = [...groups].map(([words, cols]) =>
    words === 'wall'
      ? `${cols.length === 1 ? 'wall' : 'walls'} at ${cols.length === 1 ? 'column' : 'columns'} ${listWords(cols.map(String))}`
      : `${words} at column ${cols[0] ?? ''}`,
  );
  return `Row ${r + 1}: ${parts.join('; ')}`;
}

const WALL_STYLE = {
  backgroundImage:
    'repeating-linear-gradient(45deg, transparent 0 4px, rgb(255 255 255 / 0.18) 4px 7px)',
};

function Cell({ role }: { role: Role }) {
  switch (role.type) {
    case 'wall':
      return <span className="block h-full w-full rounded-sm bg-line-strong" style={WALL_STYLE} />;
    case 'start':
      return <span className="text-base leading-none sm:text-xl">🐢</span>;
    case 'goal':
      return <span className="text-base leading-none sm:text-xl">⭐</span>;
    case 'exit':
      return (
        <span className="flex h-4/5 w-4/5 items-center justify-center rounded-md border-2 border-glow bg-glow/15 text-xs font-bold text-glow sm:text-sm">
          {role.letter}
        </span>
      );
    case 'mark':
      return (
        <span className="flex h-4/5 w-4/5 items-center justify-center rounded-full border-2 border-brand bg-brand/20 text-xs font-bold text-ink sm:text-sm">
          {role.number}
        </span>
      );
    case 'open':
      return null;
  }
}

export function GridPathView({ challenge }: ContentViewProps<GridPathChallenge>) {
  const { content } = challenge;
  const { size } = content;
  return (
    <figure className="mx-auto flex w-full max-w-sm flex-col gap-2">
      <div
        aria-hidden="true"
        className="grid w-full gap-0.5 rounded-lg border border-line bg-canvas p-1"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }, (_, cell) => {
          const role = roleOf(content, cell);
          return (
            <span
              key={cell}
              className={`flex aspect-square items-center justify-center rounded-sm ${role.type === 'wall' ? 'p-0' : 'bg-raised'}`}
            >
              <Cell role={role} />
            </span>
          );
        })}
      </div>
      <figcaption className="text-center text-xs text-ink-muted">
        <span aria-hidden="true">
          🐢 start · {content.goal === null ? 'letters: exits' : '⭐ goal'}
        </span>
        <span aria-hidden="true"> · striped squares are walls</span>
        <span className="sr-only">
          Maze of {size} by {size} squares, described row by row.
        </span>
      </figcaption>
      <ol className="sr-only">
        {Array.from({ length: size }, (_, r) => (
          <li key={r}>{rowWords(content, r)}</li>
        ))}
      </ol>
    </figure>
  );
}
