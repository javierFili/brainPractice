import { pairsTally, type Answer, type Challenge, type Response } from '@/domain/challenge';
import { joinText, msg, type Text } from '@/domain/shared';

const optionLabel = (response: Response, id: string): Text =>
  response.format === 'single-choice'
    ? (response.question.options.find((o) => o.id === id)?.label ?? id)
    : id;

const itemLabels = (response: Response, ids: readonly string[]): Text =>
  joinText(
    response.format === 'ordering'
      ? ids.map((id) => response.question.items.find((item) => item.id === id)?.label ?? id)
      : ids,
    ' → ',
  );

const symbolLabels = (response: Response, ids: readonly string[]): Text =>
  joinText(
    response.format === 'sequence'
      ? ids.map((id) => response.question.symbols.find((s) => s.id === id)?.label ?? id)
      : ids,
    ' · ',
  );

const positions = (indices: readonly number[]): Text =>
  indices.length === 0
    ? msg('common:describe.nothingMarked')
    : msg('common:describe.items', {
        count: indices.length,
        positions: joinText(
          [...indices].sort((a, b) => a - b).map((i) => String(i + 1)),
          ', ',
        ),
      });

/** Correct answer in words, for feedback and the results review. */
export function describeSolution({ response }: Challenge): Text {
  switch (response.format) {
    case 'single-choice':
      return optionLabel(response, response.solution.optionId);
    case 'ordering':
      return itemLabels(response, response.solution.order);
    case 'locate':
      return msg('common:describe.item', { position: response.solution.index + 1 });
    case 'numeric':
      return msg('common:describe.number', { value: response.solution.value });
    case 'sequence':
      return symbolLabels(response, response.solution.sequence);
    case 'multi-select':
      return positions(response.solution.indices);
    case 'pairs':
      return msg('common:describe.allPairs', { count: response.solution.pairs.length });
    case 'tap':
      return response.solution.shouldTap
        ? msg('common:describe.tapDuringSignal')
        : msg('common:describe.doNotTap');
  }
}

export function describeAnswer({ response }: Challenge, answer: Answer | null): Text {
  if (answer === null) return msg('common:describe.noAnswer');
  switch (answer.format) {
    case 'single-choice':
      return optionLabel(response, answer.optionId);
    case 'ordering':
      return itemLabels(response, answer.order);
    case 'locate':
      return msg('common:describe.item', { position: answer.index + 1 });
    case 'numeric':
      return msg('common:describe.number', { value: answer.value });
    case 'sequence':
      return symbolLabels(response, answer.sequence);
    case 'multi-select':
      return positions(answer.indices);
    case 'pairs': {
      if (response.format !== 'pairs') {
        return msg('common:describe.attempts', { count: answer.attempts.length });
      }
      const { found, misses } = pairsTally(response.solution.pairs, answer.attempts);
      return msg('common:describe.pairsFound', {
        found,
        total: response.solution.pairs.length,
        misses: msg('common:describe.misses', { count: misses }),
      });
    }
    case 'tap':
      if (!answer.tapped || answer.reactionMs === null) return msg('common:describe.noTap');
      return answer.reactionMs < 0
        ? msg('common:describe.tappedEarly')
        : msg('common:describe.tappedAfter', { ms: Math.round(answer.reactionMs) });
  }
}
