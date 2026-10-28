import { Chips, ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { CATEGORIES } from '../content/categories';
import { describeClue } from '../content/solver';
import type { DeductionChallenge } from '../content/types';

export function LogicalDeductionView({ challenge, phase }: ContentViewProps<DeductionChallenge>) {
  const { content } = challenge;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="People">
          <Chips items={content.people} label="People" />
        </Panel>
        {content.categories.map((category) => (
          <Panel key={category.id} title={CATEGORIES[category.id].title}>
            <Chips items={category.values} label={CATEGORIES[category.id].title} />
          </Panel>
        ))}
      </div>
      <Panel title="Clues · all of them are true">
        <ClueList clues={content.clues.map((clue) => describeClue(clue, content))} label="Clues" />
      </Panel>
      {phase === 'review' && (
        <Panel title="Solution">
          <table className="w-full text-left text-sm text-ink-soft">
            <thead>
              <tr>
                <th scope="col" className="py-1 pr-3 font-semibold text-ink">
                  Person
                </th>
                {content.categories.map((category) => (
                  <th key={category.id} scope="col" className="py-1 pr-3 font-semibold text-ink">
                    {CATEGORIES[category.id].title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.people.map((person, p) => (
                <tr key={person} className="border-t border-line">
                  <th scope="row" className="py-1 pr-3 font-medium text-ink">
                    {person}
                  </th>
                  {content.categories.map((category, c) => (
                    <td key={category.id} className="py-1 pr-3">
                      {category.values[content.solution[c]?.[p] as number]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
