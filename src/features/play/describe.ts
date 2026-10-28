import { pairsTally, type Answer, type Challenge, type Response } from '@/domain/challenge';

const optionLabel = (response: Response, id: string) =>
  response.format === 'single-choice'
    ? (response.question.options.find((o) => o.id === id)?.label ?? id)
    : id;

const itemLabels = (response: Response, ids: readonly string[]) =>
  response.format === 'ordering'
    ? ids
        .map((id) => response.question.items.find((item) => item.id === id)?.label ?? id)
        .join(' → ')
    : ids.join(' → ');

const symbolLabels = (response: Response, ids: readonly string[]) =>
  response.format === 'sequence'
    ? ids.map((id) => response.question.symbols.find((s) => s.id === id)?.label ?? id).join(' · ')
    : ids.join(' · ');

const positions = (indices: readonly number[]) =>
  indices.length === 0
    ? 'nothing marked'
    : `${indices.length === 1 ? 'item' : 'items'} ${[...indices]
        .sort((a, b) => a - b)
        .map((i) => i + 1)
        .join(', ')}`;

/** Human-readable correct answer, for feedback and the results review. */
export function describeSolution({ response }: Challenge): string {
  switch (response.format) {
    case 'single-choice':
      return optionLabel(response, response.solution.optionId);
    case 'ordering':
      return itemLabels(response, response.solution.order);
    case 'locate':
      return `item ${response.solution.index + 1}`;
    case 'numeric':
      return String(response.solution.value);
    case 'sequence':
      return symbolLabels(response, response.solution.sequence);
    case 'multi-select':
      return positions(response.solution.indices);
    case 'pairs':
      return `all ${response.solution.pairs.length} pairs`;
    case 'tap':
      return response.solution.shouldTap ? 'tap while the signal is shown' : 'do not tap';
  }
}

export function describeAnswer({ response }: Challenge, answer: Answer | null): string {
  if (answer === null) return 'no answer';
  switch (answer.format) {
    case 'single-choice':
      return optionLabel(response, answer.optionId);
    case 'ordering':
      return itemLabels(response, answer.order);
    case 'locate':
      return `item ${answer.index + 1}`;
    case 'numeric':
      return String(answer.value);
    case 'sequence':
      return symbolLabels(response, answer.sequence);
    case 'multi-select':
      return positions(answer.indices);
    case 'pairs': {
      if (response.format !== 'pairs') return `${answer.attempts.length} attempts`;
      const { found, misses } = pairsTally(response.solution.pairs, answer.attempts);
      return `${found} of ${response.solution.pairs.length} pairs, ${misses} ${misses === 1 ? 'miss' : 'misses'}`;
    }
    case 'tap':
      if (!answer.tapped || answer.reactionMs === null) return 'no tap';
      return answer.reactionMs < 0
        ? 'tapped before the signal'
        : `tapped after ${Math.round(answer.reactionMs)} ms`;
  }
}
