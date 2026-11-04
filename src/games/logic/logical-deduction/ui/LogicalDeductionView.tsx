import { useTranslation } from 'react-i18next';
import { useText } from '@/i18n';
import { Chips, ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { categoryTitle, valueLabel } from '../content/categories';
import { describeClue } from '../content/solver';
import type { DeductionChallenge } from '../content/types';

export function LogicalDeductionView({ challenge, phase }: ContentViewProps<DeductionChallenge>) {
  const { t } = useTranslation('logic');
  const tx = useText();
  const { content } = challenge;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title={t('logicalDeduction.view.people')}>
          <Chips items={content.people} label={t('logicalDeduction.view.people')} />
        </Panel>
        {content.categories.map((category) => (
          <Panel key={category.id} title={tx(categoryTitle(category.id))}>
            <Chips
              items={category.values.map((value) => valueLabel(category.id, value))}
              label={tx(categoryTitle(category.id))}
            />
          </Panel>
        ))}
      </div>
      <Panel title={t('shared.cluesTitle')}>
        <ClueList
          clues={content.clues.map((clue) => describeClue(clue, content))}
          label={t('shared.clues')}
        />
      </Panel>
      {phase === 'review' && (
        <Panel title={t('shared.solution')}>
          <table className="w-full text-left text-sm text-ink-soft">
            <thead>
              <tr>
                <th scope="col" className="py-1 pr-3 font-semibold text-ink">
                  {t('logicalDeduction.view.person')}
                </th>
                {content.categories.map((category) => (
                  <th key={category.id} scope="col" className="py-1 pr-3 font-semibold text-ink">
                    {tx(categoryTitle(category.id))}
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
                      {tx(
                        valueLabel(
                          category.id,
                          category.values[content.solution[c]?.[p] as number] as string,
                        ),
                      )}
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
