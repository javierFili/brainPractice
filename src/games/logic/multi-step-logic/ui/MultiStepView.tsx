import { ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { comparisonTexts, describeFact } from '../content/text';
import type { MultiStepChallenge } from '../content/types';

export function MultiStepView({ challenge }: ContentViewProps<MultiStepChallenge>) {
  const { content } = challenge;
  const facts =
    content.kind === 'numbers'
      ? content.facts.map((f) => describeFact(f, content.theme, content.names))
      : comparisonTexts(content);
  return (
    <Panel title="Facts · all of them are true">
      <ClueList clues={facts} label="Facts" />
    </Panel>
  );
}
