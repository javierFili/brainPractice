import { err, ok, type Result } from '../shared/result';
import type { AnswerOf, Exercise, ExerciseAnswer, ExerciseKind, ExerciseOf } from './exercise';

export type Verdict = 'correct' | 'partial' | 'incorrect';

/**
 * Feedback that teaches. `diagnosis` explains the learner's own answer (shown on every attempt);
 * `explanation` and `correctAnswer` give the solution away, so a lesson shows them only once no
 * retry is left or the learner asks for the solution.
 */
export interface Feedback {
  readonly headline: string;
  /** "You chose B." / "You answered 15." */
  readonly yourAnswer: string;
  /** Why that answer is wrong (or what was right about it), 0–2 short sentences. */
  readonly diagnosis: readonly string[];
  readonly explanation: string;
  readonly correctAnswer: string;
}

export interface Evaluation {
  readonly verdict: Verdict;
  /** 0–1: partial credit for partly right answers (2 of 3 blanks, right line wrong cause…). */
  readonly credit: number;
  readonly feedback: Feedback;
}

export type AnswerError =
  | { readonly code: 'KIND_MISMATCH'; readonly expected: ExerciseKind }
  | { readonly code: 'EMPTY' }
  | { readonly code: 'UNKNOWN_CHOICE'; readonly id: string }
  | { readonly code: 'MALFORMED'; readonly reason: string };

const verdictOf = (credit: number): Verdict =>
  credit >= 1 ? 'correct' : credit > 0 ? 'partial' : 'incorrect';
const HEADLINES: Readonly<Record<Verdict, string>> = {
  correct: 'Correct.',
  partial: 'Partly right.',
  incorrect: 'Not quite.',
};

function evaluation(
  credit: number,
  parts: Omit<Feedback, 'headline' | 'diagnosis'> & { diagnosis?: readonly (string | undefined)[] },
): Evaluation {
  const verdict = verdictOf(credit);
  const diagnosis = (parts.diagnosis ?? []).filter((d): d is string => d !== undefined && d !== '');
  return {
    verdict,
    credit,
    feedback: { ...parts, diagnosis, headline: HEADLINES[verdict] },
  };
}

// ── Prediction answers: forgiving about form, strict about meaning ──────────────────────────────

/** Canonical spelling: quotes unified, spacing outside text removed, numbers and keywords normalised. */
export function canonicalValue(raw: string): string {
  const unified = raw.trim().replace(/'/g, '"');
  if (/^-?\d+(\.\d+)?$/.test(unified)) return String(Number(unified));
  if (/^(true|false|none)$/i.test(unified)) return unified.toLowerCase();
  let out = '';
  let inText = false;
  for (const char of unified) {
    if (char === '"') inText = !inText;
    if (!inText && /\s/.test(char)) continue;
    out += char;
  }
  return out.replace(
    /(^|[,[])(-?\d+(\.\d+)?)(?=[,\]]|$)/g,
    (_, lead: string, n: string) => `${lead}${Number(n)}`,
  );
}

/** Text answers may be typed with or without quotes. */
export function predictionMatches(
  raw: string,
  expected: string,
  target: 'variable' | 'output',
): boolean {
  if (target === 'output') return canonicalOutput(raw) === canonicalOutput(expected);
  const want = canonicalValue(expected);
  let got = canonicalValue(raw);
  if (want.startsWith('"') && !got.startsWith('"')) got = canonicalValue(`"${raw.trim()}"`);
  return got === want;
}

export const canonicalOutput = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line, i, lines) => line !== '' || lines.slice(i).some((l) => l !== ''))
    .join('\n')
    .trim();

// ── Evaluators per kind ─────────────────────────────────────────────────────────────────────────

type Evaluator<K extends ExerciseKind> = (
  exercise: ExerciseOf<K>,
  answer: AnswerOf<K>,
) => Result<Evaluation, AnswerError>;

const labelOf = (options: readonly { id: string; label: string }[], id: string) =>
  options.find((o) => o.id === id)?.label ?? id;

const multipleChoice: Evaluator<'multiple-choice'> = (exercise, answer) => {
  if (!exercise.options.some((o) => o.id === answer.optionId))
    return err({ code: 'UNKNOWN_CHOICE', id: answer.optionId });
  const correct = answer.optionId === exercise.correctOptionId;
  return ok(
    evaluation(correct ? 1 : 0, {
      yourAnswer: `You chose “${labelOf(exercise.options, answer.optionId)}”.`,
      diagnosis: correct ? [] : [exercise.misconceptions[answer.optionId]],
      explanation: exercise.explanation,
      correctAnswer: labelOf(exercise.options, exercise.correctOptionId),
    }),
  );
};

const prediction: Evaluator<'prediction'> = (exercise, answer) => {
  if (answer.value.trim() === '') return err({ code: 'EMPTY' });
  const correct = predictionMatches(answer.value, exercise.expected, exercise.target.kind);
  const mistake = Object.entries(exercise.commonMistakes ?? {}).find(([wrong]) =>
    predictionMatches(answer.value, wrong, exercise.target.kind),
  )?.[1];
  return ok(
    evaluation(correct ? 1 : 0, {
      yourAnswer: `You answered ${answer.value.trim()}.`,
      diagnosis: correct ? [] : [mistake],
      explanation: exercise.explanation,
      correctAnswer: exercise.expected,
    }),
  );
};

const codeCompletion: Evaluator<'code-completion'> = (exercise, answer) => {
  for (const blank of exercise.blanks) {
    const chosen = answer.blanks[blank.id];
    if (chosen === undefined)
      return err({ code: 'MALFORMED', reason: `blank ${blank.id} is empty` });
    if (!blank.options.includes(chosen)) return err({ code: 'UNKNOWN_CHOICE', id: chosen });
  }
  const wrong = exercise.blanks.filter((b) => answer.blanks[b.id] !== b.correct);
  const credit = (exercise.blanks.length - wrong.length) / exercise.blanks.length;
  return ok(
    evaluation(credit, {
      yourAnswer:
        exercise.blanks.length === 1
          ? `You filled in ${answer.blanks[exercise.blanks[0]?.id ?? ''] ?? ''}.`
          : `${exercise.blanks.length - wrong.length} of ${exercise.blanks.length} blanks are right.`,
      diagnosis: wrong.map(
        (b) => exercise.misconceptions?.[`${b.id}:${answer.blanks[b.id] ?? ''}`] ?? undefined,
      ),
      explanation: exercise.explanation,
      correctAnswer: exercise.blanks.map((b) => b.correct).join(' · '),
    }),
  );
};

const isPermutation = (order: readonly string[], ids: readonly string[]) =>
  order.length === ids.length &&
  new Set(order).size === order.length &&
  ids.every((id) => order.includes(id));

const ordering: Evaluator<'ordering'> = (exercise, answer) => {
  const ids = exercise.items.map((i) => i.id);
  if (!isPermutation(answer.order, ids))
    return err({ code: 'MALFORMED', reason: 'the order must use every item exactly once' });
  const inPlace = answer.order.filter((id, i) => id === ids[i]).length;
  const firstWrong = answer.order.findIndex((id, i) => id !== ids[i]);
  // Partial credit only when most of the sequence is right: half-right orders are still wrong programs.
  const credit = inPlace === ids.length ? 1 : inPlace / ids.length >= 0.6 ? 0.5 : 0;
  return ok(
    evaluation(credit, {
      yourAnswer: `${inPlace} of ${ids.length} steps are in the right place.`,
      diagnosis:
        firstWrong === -1
          ? []
          : [
              `Step ${firstWrong + 1} should be “${labelOf(exercise.items, ids[firstWrong] ?? '')}”.`,
            ],
      explanation: exercise.explanation,
      correctAnswer: exercise.items.map((i) => i.label).join(' → '),
    }),
  );
};

/** Longest common subsequence length: how much of the solution appears in the right relative order. */
function lcs(a: readonly string[], b: readonly string[]): number {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      (table[i] as number[])[j] =
        a[i - 1] === b[j - 1]
          ? ((table[i - 1] as number[])[j - 1] as number) + 1
          : Math.max(
              (table[i - 1] as number[])[j] as number,
              (table[i] as number[])[j - 1] as number,
            );
  return (table[a.length] as number[])[b.length] as number;
}

const blockBuilder: Evaluator<'block-builder'> = (exercise, answer) => {
  const known = new Set(exercise.blocks.map((b) => b.id));
  const unknown = answer.order.find((id) => !known.has(id));
  if (unknown !== undefined) return err({ code: 'UNKNOWN_CHOICE', id: unknown });
  if (new Set(answer.order).size !== answer.order.length)
    return err({ code: 'MALFORMED', reason: 'each block can be used once' });
  if (answer.order.length === 0) return err({ code: 'EMPTY' });

  const extra = answer.order.filter((id) => !exercise.solution.includes(id));
  const missing = exercise.solution.filter((id) => !answer.order.includes(id));
  const exact =
    extra.length === 0 &&
    answer.order.every((id, i) => id === exercise.solution[i]) &&
    missing.length === 0;
  const credit = exact
    ? 1
    : extra.length === 0 && lcs(answer.order, exercise.solution) >= exercise.solution.length - 1
      ? 0.5
      : 0;
  const diagnosis = [
    ...extra.map(
      (id) => exercise.misconceptions[id] ?? `“${labelOf(exercise.blocks, id)}” is not needed.`,
    ),
    missing.length > 0
      ? `Missing: ${missing.map((id) => `“${labelOf(exercise.blocks, id)}”`).join(', ')}.`
      : undefined,
    !exact && extra.length === 0 && missing.length === 0
      ? 'The right blocks, but not in the right order.'
      : undefined,
  ];
  return ok(
    evaluation(credit, {
      yourAnswer: `You used ${answer.order.length} block${answer.order.length === 1 ? '' : 's'}.`,
      diagnosis: diagnosis.slice(0, 2),
      explanation: exercise.explanation,
      correctAnswer: exercise.solution.map((id) => labelOf(exercise.blocks, id)).join(' → '),
    }),
  );
};

const matching: Evaluator<'matching'> = (exercise, answer) => {
  const lefts = exercise.pairs.map((p) => p.left.id);
  const rights = new Set(exercise.pairs.map((p) => p.right.id));
  if (
    Object.keys(answer.pairs).length !== lefts.length ||
    lefts.some((id) => answer.pairs[id] === undefined)
  )
    return err({ code: 'MALFORMED', reason: 'every item needs a match' });
  const unknown = Object.values(answer.pairs).find((id) => !rights.has(id));
  if (unknown !== undefined) return err({ code: 'UNKNOWN_CHOICE', id: unknown });
  const wrong = exercise.pairs.filter((p) => answer.pairs[p.left.id] !== p.right.id);
  const credit =
    wrong.length === 0 ? 1 : (exercise.pairs.length - wrong.length) / exercise.pairs.length;
  return ok(
    evaluation(credit >= 1 ? 1 : credit >= 0.5 ? credit : 0, {
      yourAnswer: `${exercise.pairs.length - wrong.length} of ${exercise.pairs.length} matches are right.`,
      diagnosis: wrong.slice(0, 2).map((p) => `“${p.left.label}” goes with “${p.right.label}”.`),
      explanation: exercise.explanation,
      correctAnswer: exercise.pairs.map((p) => `${p.left.label} → ${p.right.label}`).join(' · '),
    }),
  );
};

const debugging: Evaluator<'debugging'> = (exercise, answer) => {
  const lineCount = exercise.code.source.split('\n').length;
  if (!Number.isInteger(answer.line) || answer.line < 1 || answer.line > lineCount)
    return err({ code: 'MALFORMED', reason: 'line out of range' });
  if (!exercise.causes.some((c) => c.id === answer.causeId))
    return err({ code: 'UNKNOWN_CHOICE', id: answer.causeId });
  const lineRight = answer.line === exercise.bugLine;
  const causeRight = answer.causeId === exercise.correctCauseId;
  const credit = lineRight && causeRight ? 1 : lineRight || causeRight ? 0.5 : 0;
  return ok(
    evaluation(credit, {
      yourAnswer: `You pointed at line ${answer.line}: “${labelOf(exercise.causes, answer.causeId)}”.`,
      diagnosis: [
        lineRight ? undefined : `The problem is not on line ${answer.line}.`,
        causeRight
          ? lineRight
            ? undefined
            : 'Your reason is right, though.'
          : exercise.misconceptions[answer.causeId],
      ],
      explanation: exercise.explanation,
      correctAnswer: `Line ${exercise.bugLine}: ${labelOf(exercise.causes, exercise.correctCauseId)}`,
    }),
  );
};

const EVALUATORS: { readonly [K in ExerciseKind]: Evaluator<K> } = {
  'multiple-choice': multipleChoice,
  prediction,
  'code-completion': codeCompletion,
  ordering,
  'block-builder': blockBuilder,
  matching,
  debugging,
};

/** The single entry point of the Feedback Engine. Pure: same exercise + answer → same evaluation. */
export function evaluateExercise(
  exercise: Exercise,
  answer: ExerciseAnswer,
): Result<Evaluation, AnswerError> {
  if (answer.kind !== exercise.kind) return err({ code: 'KIND_MISMATCH', expected: exercise.kind });
  const evaluate = EVALUATORS[exercise.kind] as Evaluator<ExerciseKind>;
  return evaluate(exercise, answer);
}
