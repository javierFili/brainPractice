import { glyphLabel, type Glyph } from '@/games/kit/content';
import { Glyph as GlyphIcon } from '@/games/kit/ui';
import { Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { describeRule } from '../content/rules';
import type { RuleChallenge } from '../content/types';

function Group({
  title,
  mark,
  items,
}: {
  readonly title: string;
  readonly mark: '✓' | '✗';
  readonly items: readonly (Glyph | number)[];
}) {
  return (
    <Panel title={`${mark} ${title}`}>
      <ul
        aria-label={title}
        className={`flex flex-wrap gap-2 rounded-lg border p-3 ${mark === '✓' ? 'border-success/60 bg-success/5' : 'border-dashed border-danger/60 bg-danger/5'}`}
      >
        {items.map((item) =>
          typeof item === 'number' ? (
            <li
              key={item}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line bg-raised px-2 font-mono text-lg text-ink"
            >
              {item}
            </li>
          ) : (
            <li
              key={glyphLabel(item)}
              className="flex flex-col items-center rounded-md border border-line bg-raised p-1.5"
            >
              <GlyphIcon glyph={item} />
              <span className="text-xs text-ink-muted">{glyphLabel(item)}</span>
            </li>
          ),
        )}
      </ul>
    </Panel>
  );
}

export function RuleDiscoveryView({ challenge, phase }: ContentViewProps<RuleChallenge>) {
  const { content } = challenge;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Group title="Fits the rule" mark="✓" items={content.fits} />
        <Group title="Does not fit" mark="✗" items={content.misses} />
      </div>
      {phase === 'review' && (
        <p className="text-sm text-ink-soft">
          The rule: <span className="font-semibold text-ink">{describeRule(content.rule)}</span>.
        </p>
      )}
    </div>
  );
}
