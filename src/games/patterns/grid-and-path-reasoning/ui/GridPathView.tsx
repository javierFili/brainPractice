import type { ContentViewProps } from '@/games/types';
import { useTranslation } from 'react-i18next';
import { joinText, msg, type Message } from '@/domain/shared';
import { useText } from '@/i18n';
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

const V = 'patterns:gridAndPathReasoning.view';

/** Names a role on its own ("turtle (start)", "exit A"); walls are listed together per row. */
const roleWords = (role: Exclude<Role, { type: 'open' | 'wall' }>): Message => {
  switch (role.type) {
    case 'start':
      return msg(`${V}.start`);
    case 'goal':
      return msg(`${V}.goal`);
    case 'exit':
      return msg(`${V}.exit`, { letter: role.letter });
    case 'mark':
      return msg(`${V}.cell`, { number: role.number });
  }
};

/** "Row 2: walls at columns 1 and 4; exit A at column 6" — open squares are not listed. */
function rowWords(content: GridPathContent, r: number): Message {
  const { size } = content;
  const walls: number[] = [];
  const parts: Message[] = [];
  for (let c = 0; c < size; c++) {
    const role = roleOf(content, r * size + c);
    if (role.type === 'open') continue;
    if (role.type === 'wall') walls.push(c + 1);
    else parts.push(msg(`${V}.at`, { what: roleWords(role), column: c + 1 }));
  }
  if (walls.length > 0)
    parts.unshift(msg(`${V}.walls`, { count: walls.length, columns: joinText(walls.map(String)) }));
  if (parts.length === 0) return msg(`${V}.rowOpen`, { row: r + 1 });
  return msg(`${V}.row`, { row: r + 1, parts: joinText(parts, '; ') });
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
  const { t } = useTranslation('patterns');
  const tx = useText();
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
          🐢 {t('gridAndPathReasoning.view.legendStart')} ·{' '}
          {content.goal === null
            ? t('gridAndPathReasoning.view.legendExits')
            : `⭐ ${t('gridAndPathReasoning.view.legendGoal')}`}
        </span>
        <span aria-hidden="true"> · {t('gridAndPathReasoning.view.legendWalls')}</span>
        <span className="sr-only">{t('gridAndPathReasoning.view.maze', { size })}</span>
      </figcaption>
      <ol className="sr-only">
        {Array.from({ length: size }, (_, r) => (
          <li key={r}>{tx(rowWords(content, r))}</li>
        ))}
      </ol>
    </figure>
  );
}
