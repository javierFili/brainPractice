import { retryGeneration, type GameDefinition } from '@/domain/game';
import {
  chance,
  pick,
  randomInt,
  sample,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { capitalize, fixedChoice, type Draft } from '@/games/logic/shared/content';
import { CONDITIONAL_LEVELS } from './levels';
import { describePremise, describeWorld, models, sentence, verdict } from './logic';
import type {
  ConditionalChallenge,
  ConditionalContent,
  ConditionalProfile,
  Literal,
  Pattern,
  Premise,
  Structure,
  Verdict,
} from './types';

export const CONDITIONAL_REASONING_ID = gameIdOf('conditional-reasoning');

/** Neutral everyday sentences with their negations. */
const ATOMS: readonly (readonly [string, string])[] = [
  ['the lamp is on', 'the lamp is not on'],
  ['the door is open', 'the door is not open'],
  ['the bell rings', 'the bell does not ring'],
  ['the flag is up', 'the flag is not up'],
  ['the train is late', 'the train is not late'],
  ['the box is full', 'the box is not full'],
  ['it is raining', 'it is not raining'],
  ['the shop is open', 'the shop is not open'],
  ['the dog barks', 'the dog does not bark'],
  ['the kettle is hot', 'the kettle is not hot'],
  ['the gate is locked', 'the gate is not locked'],
  ['the radio is playing', 'the radio is not playing'],
];

export const VERDICT_LABELS: Record<Verdict, string> = {
  true: 'Must be true',
  false: 'Must be false',
  unknown: "Can't tell",
};

const lit = (atom: number, value: boolean): Literal => ({ atom, value });
const not = (l: Literal): Literal => ({ atom: l.atom, value: !l.value });

interface Candidate {
  readonly kind: Structure;
  readonly atomCount: number;
  readonly premises: Premise[];
  readonly question: Literal;
  readonly pattern: Pattern;
}

const part = (random: RandomGenerator, atom: number, negated: boolean) =>
  lit(atom, negated ? !chance(random, 0.3) : true);

/** One rule (if / unless / only if) plus one fact: the four classic patterns. */
function oneRule(random: RandomGenerator, profile: ConditionalProfile, kind: Structure): Candidate {
  // For "unless" the condition is worded as not-a, so a is usually negated to keep it positive.
  const a = kind === 'unless' ? lit(0, chance(random, 0.3)) : part(random, 0, profile.negatedParts);
  const b = part(random, 1, profile.negatedParts);
  // Every rule here means "if a then b"; only the wording differs.
  const rule: Premise =
    kind === 'unless'
      ? { type: 'unless', main: b, cond: not(a) }
      : kind === 'only-if'
        ? { type: 'only-if', a, b }
        : { type: 'if', a, b };
  const pattern = pick(random, profile.patterns);
  const fact =
    pattern === 'affirm-antecedent'
      ? a
      : pattern === 'deny-antecedent'
        ? not(a)
        : pattern === 'affirm-consequent'
          ? b
          : not(b);
  const asked = pattern === 'affirm-antecedent' || pattern === 'deny-antecedent' ? b : a;
  const question = chance(random, 0.5) ? asked : not(asked);
  return {
    kind,
    atomCount: 2,
    premises: shuffle(random, [rule, { type: 'fact', lit: fact }]),
    question,
    pattern,
  };
}

function chain(random: RandomGenerator, profile: ConditionalProfile): Candidate {
  const n = profile.chainLength + 1;
  const parts = Array.from({ length: n }, (_, i) => part(random, i, profile.negatedParts));
  const rules: Premise[] = parts
    .slice(1)
    .map((b, i) => ({ type: 'if', a: parts[i] as Literal, b }));
  const first = parts[0] as Literal;
  const last = parts[n - 1] as Literal;
  const middle = parts[randomInt(random, 1, n - 2)] as Literal;
  const choice = randomInt(random, 0, 3);
  const [fact, asked] =
    choice === 0
      ? [first, last]
      : choice === 1
        ? [not(last), first]
        : choice === 2
          ? [last, first]
          : [not(first), pick(random, [middle, last])];
  return {
    kind: 'chain',
    atomCount: n,
    premises: [...shuffle(random, rules), { type: 'fact', lit: fact }],
    question: chance(random, 0.5) ? asked : not(asked),
    pattern: 'none',
  };
}

function mixed(random: RandomGenerator, profile: ConditionalProfile): Candidate {
  const n = profile.atoms;
  const any = () => lit(randomInt(random, 0, n - 1), !chance(random, 0.35));
  const premises: Premise[] = [];
  for (let i = 0; i < profile.chainLength; i++) {
    const a = any();
    let b = any();
    while (b.atom === a.atom) b = any();
    const type = pick(random, ['if', 'if', 'unless', 'only-if', 'or'] as const);
    premises.push(type === 'unless' ? { type, main: b, cond: a } : { type, a, b });
  }
  const factCount = n > 3 ? 2 : 1;
  const factAtoms = sample(random, [...Array(n).keys()], factCount);
  for (const atom of factAtoms)
    premises.push({ type: 'fact', lit: lit(atom, chance(random, 0.6)) });
  const askable = [...Array(n).keys()].filter((atom) => !factAtoms.includes(atom));
  return {
    kind: 'mixed',
    atomCount: n,
    premises: shuffle(random, premises),
    question: lit(pick(random, askable), chance(random, 0.5)),
    pattern: 'none',
  };
}

const PATTERN_NOTES: Record<Exclude<Pattern, 'none'>, string> = {
  'affirm-antecedent':
    'The rule applies, because its “if” part is true, so its “then” part follows.',
  'deny-consequent':
    'If the “if” part were true, the “then” part would be true too — but it is not, so the “if” part cannot be true.',
  'affirm-consequent':
    'Knowing the “then” part is a common trap: it could be true for some other reason, so the “if” part is not settled.',
  'deny-antecedent':
    'The rule only says what happens when its “if” part is true. Here it is not, so the rule tells us nothing.',
};

const WORDING_NOTES: Partial<Record<Structure, string>> = {
  unless: '“X unless Y” means: if Y is not true, then X is true.',
  'only-if': '“X only if Y” means: if X is true, then Y is true.',
};

export function explain(content: ConditionalContent, answer: Verdict): string {
  const atomCount = content.atoms.length;
  const worlds = models(atomCount, content.premises);
  const asked = `“${sentence(content.atoms, content.question)}”`;
  const notes = [
    ...(content.kind === 'mixed'
      ? content.premises.some((p) => p.type === 'unless')
        ? [WORDING_NOTES.unless as string]
        : []
      : [WORDING_NOTES[content.kind] ?? '']),
    ...(content.premises.some((p) => p.type === 'only-if') && content.kind === 'mixed'
      ? [WORDING_NOTES['only-if'] as string]
      : []),
    content.pattern === 'none' ? '' : PATTERN_NOTES[content.pattern],
  ].filter((note) => note !== '');
  const holds = (w: readonly boolean[]) => w[content.question.atom] === content.question.value;
  const verdictText =
    answer === 'unknown'
      ? `Both are possible: ${asked} is true if ${describeWorld(content.atoms, worlds.find(holds) as boolean[])}, and false if ${describeWorld(content.atoms, worlds.find((w) => !holds(w)) as boolean[])}. So you can't tell.`
      : `Every situation that fits all the statements has ${asked} ${answer === 'true' ? 'true' : 'false'}, so it ${answer === 'true' ? 'must be true' : 'must be false'}.`;
  return [...notes, verdictText].join(' ');
}

export const conditionalReasoningGame: GameDefinition<ConditionalChallenge, ConditionalProfile> = {
  id: CONDITIONAL_REASONING_ID,
  name: 'Conditional Reasoning',
  tagline: 'If this, then that — what really follows?',
  description:
    'Read a few “if … then …” statements and facts, then decide whether a sentence must be true, must be false, or cannot be decided. Higher levels chain rules together and use “unless” and “only if”.',
  area: 'logic',
  skills: ['logical-reasoning', 'instruction-comprehension', 'problem-solving'],
  meta: {
    category: 'logic',
    audiences: ['teens', 'adults', 'seniors', 'kids'],
    interaction: 'choice',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each answer is checked against every situation that fits the statements. Your result is the share of answers that are correct; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Treat every statement as true, even if it sounds unusual.',
    'Use only what the statements say — nothing else.',
    '“Must be true” or “must be false” means no other situation is possible. Otherwise choose “Can’t tell”.',
    'Careful: “if A, then B” does not mean “if B, then A”.',
  ],
  simpleInstructions: 'Use only the rules to decide: yes for sure, no for sure, or can’t tell.',
  levels: CONDITIONAL_LEVELS,
  generate({ identity, profile, random }) {
    const target = pick(random, profile.verdicts);
    const { candidate, answer } = retryGeneration('conditional puzzle', () => {
      const kind = weightedPick(random, profile.structures);
      const candidate =
        kind === 'chain'
          ? chain(random, profile)
          : kind === 'mixed'
            ? mixed(random, profile)
            : oneRule(random, profile, kind);
      const answer = verdict(candidate.atomCount, candidate.premises, candidate.question);
      return answer === target ? { candidate, answer } : null;
    });
    const atoms = sample(random, ATOMS, candidate.atomCount);
    const content: ConditionalContent = {
      kind: candidate.kind,
      atoms,
      premises: candidate.premises,
      question: candidate.question,
      pattern: candidate.pattern,
    };
    const draft: Draft<ConditionalChallenge> = {
      prompt: `Is this true? “${capitalize(sentence(atoms, candidate.question))}.”`,
      content,
      response: fixedChoice(
        ['true', 'false', 'unknown'].map((v) => VERDICT_LABELS[v as Verdict]),
        VERDICT_LABELS[answer],
      ),
      explanation: explain(content, answer),
      skills: ['logical-reasoning', 'instruction-comprehension'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};

export const premiseTexts = (content: ConditionalContent) =>
  content.premises.map((p) => describePremise(content.atoms, p));
