import type { Answer, Challenge, Response } from '@/domain/challenge';

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
  }
}
