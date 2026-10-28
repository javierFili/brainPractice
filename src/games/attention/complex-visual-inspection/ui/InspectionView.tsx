import { COLORS } from '@/games/kit/content';
import { MultiSelectBoard } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, mark, markLabel } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import { ruleText } from '../content/definition';
import type { InspectionChallenge } from '../content/types';

export function InspectionView({
  challenge,
  respond,
  answer,
}: ContentViewProps<InspectionChallenge>) {
  const { items, columns, rule } = challenge.content;
  const { response } = challenge;
  if (response.format !== 'multi-select')
    throw new Error('Complex Visual Inspection uses multi-select');
  const exampleColor = rule.negated
    ? (COLORS.find((c) => c !== rule.color) ?? rule.color)
    : rule.color;
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-line bg-raised px-3 py-1.5 text-sm text-ink-soft">
        Rule{rule.negated ? ' (e.g.)' : ''}:
        <MarkFace
          mark={mark(rule.shape, exampleColor, rule.rotation, rule.mirrored)}
          className="h-8 w-8"
        />
        <span className="font-semibold text-ink">{ruleText(rule)}</span>
      </p>
      <MultiSelectBoard
        response={response}
        label="Items"
        columns={columns}
        size={columns >= 5 ? 'sm' : 'md'}
        respond={respond}
        answer={answer}
        cells={items.map((m, i) => ({
          key: String(i),
          label: `${cellName(i, columns)}, ${markLabel(m)}`,
          content: <MarkFace mark={m} />,
        }))}
      />
    </div>
  );
}
