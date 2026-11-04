import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import type { ContentViewProps } from '@/games/types';
import { describeGrid } from '../../shared/content';
import { Missing, TileGridFigure } from '../../shared/ui';
import type { RuleDiscoveryChallenge } from '../content/types';

function Arrow() {
  return (
    <span aria-hidden="true" className="text-xl text-glow">
      →
    </span>
  );
}

export function RuleDiscoveryView({ challenge }: ContentViewProps<RuleDiscoveryChallenge>) {
  const { t } = useTranslation('patterns');
  const { examples, question, steps } = challenge.content;
  const V = 'patterns:ruleBasedPatternDiscovery.view';
  const size = question.length;
  const figure = size >= 5 ? 'w-24 sm:w-28' : size >= 4 ? 'w-20 sm:w-24' : 'w-16 sm:w-20';
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-ink-muted">
        {t(`ruleBasedPatternDiscovery.view.${steps === 1 ? 'one' : 'two'}`)}
      </p>
      <ol aria-label={t('ruleBasedPatternDiscovery.view.examples')} className="flex flex-col gap-2">
        {examples.map((example, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border border-line bg-raised/50 px-3 py-2"
          >
            <span className="w-6 text-xs text-ink-muted">{i + 1}</span>
            <TileGridFigure
              grid={example.input}
              className={figure}
              label={msg(`${V}.input`, { index: i + 1, grid: describeGrid(example.input) })}
            />
            <Arrow />
            <TileGridFigure
              grid={example.output}
              className={figure}
              label={msg(`${V}.output`, { index: i + 1, grid: describeGrid(example.output) })}
            />
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3 rounded-lg border border-glow/50 bg-glow/5 px-3 py-2">
        <span className="w-6 text-xs text-glow">{t('ruleBasedPatternDiscovery.view.new')}</span>
        <TileGridFigure
          grid={question}
          className={figure}
          label={msg(`${V}.newInput`, { grid: describeGrid(question) })}
        />
        <Arrow />
        <Missing
          label={t('ruleBasedPatternDiscovery.view.newOutput')}
          className="h-16 w-16 sm:h-20 sm:w-20"
        />
      </div>
    </div>
  );
}
