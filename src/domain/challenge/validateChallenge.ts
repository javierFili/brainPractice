import type { Challenge, ChallengeTiming } from './challenge';
import type { ChoiceOption, Response } from './responseFormats';

const isPositiveOrNull = (value: number | null) =>
  value === null || (Number.isFinite(value) && value > 0);

function optionIssues(options: readonly ChoiceOption[], label: string): string[] {
  const issues: string[] = [];
  if (options.length < 2) issues.push(`${label}: at least 2 entries required`);
  if (new Set(options.map((o) => o.id)).size !== options.length)
    issues.push(`${label}: duplicate ids`);
  if (new Set(options.map((o) => o.label)).size !== options.length) {
    issues.push(`${label}: duplicate labels make the challenge ambiguous`);
  }
  if (options.some((o) => o.label.trim() === '')) issues.push(`${label}: empty label`);
  return issues;
}

export function validateResponse(response: Response): string[] {
  switch (response.format) {
    case 'single-choice': {
      const { options } = response.question;
      const issues = optionIssues(options, 'options');
      if (!options.some((o) => o.id === response.solution.optionId)) {
        issues.push('solution references an unknown option');
      }
      return issues;
    }
    case 'ordering': {
      const { items } = response.question;
      const issues = optionIssues(items, 'items');
      const ids = new Set(items.map((i) => i.id));
      const { order } = response.solution;
      if (
        order.length !== items.length ||
        new Set(order).size !== order.length ||
        !order.every((id) => ids.has(id))
      ) {
        issues.push('solution must be a permutation of the items');
      }
      return issues;
    }
    case 'locate': {
      const { itemCount } = response.question;
      const { index } = response.solution;
      if (!Number.isInteger(itemCount) || itemCount < 2)
        return ['itemCount must be an integer >= 2'];
      return Number.isInteger(index) && index >= 0 && index < itemCount
        ? []
        : ['solution index out of range'];
    }
    case 'numeric':
      return Number.isFinite(response.solution.value) ? [] : ['solution must be a finite number'];
  }
}

export function validateTiming(timing: ChallengeTiming): string[] {
  const issues: string[] = [];
  if (!isPositiveOrNull(timing.studyMs)) issues.push('studyMs must be positive or null');
  if (!isPositiveOrNull(timing.limitMs)) issues.push('limitMs must be positive or null');
  if (!(Number.isFinite(timing.targetMs) && timing.targetMs > 0))
    issues.push('targetMs must be positive');
  if (timing.limitMs !== null && timing.limitMs > 0 && timing.targetMs > timing.limitMs)
    issues.push('targetMs exceeds limitMs');
  return issues;
}

/** Structural checks every generated challenge must pass. Returns human-readable issues; empty = valid. */
export function validateChallenge(challenge: Challenge): string[] {
  const issues = [...validateResponse(challenge.response), ...validateTiming(challenge.timing)];
  if (challenge.prompt.trim() === '') issues.push('prompt is empty');
  if (challenge.explanation.trim() === '') issues.push('explanation is empty');
  if (challenge.skills.length === 0) issues.push('at least one skill is required');
  if (challenge.content.kind.trim() === '') issues.push('content.kind is empty');
  return issues;
}
