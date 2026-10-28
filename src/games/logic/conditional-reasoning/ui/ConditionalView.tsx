import { ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { premiseTexts } from '../content/definition';
import type { ConditionalChallenge } from '../content/types';

export function ConditionalView({ challenge }: ContentViewProps<ConditionalChallenge>) {
  return (
    <Panel title="Statements · treat them all as true">
      <ClueList clues={premiseTexts(challenge.content)} label="Statements" />
    </Panel>
  );
}
