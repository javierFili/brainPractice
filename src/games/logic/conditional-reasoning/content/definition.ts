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
import { gameIdOf, joinText, msg, type Message, type Text } from '@/domain/shared';
import { fixedChoice, type Draft } from '@/games/logic/shared/content';
import { CONDITIONAL_LEVELS } from './levels';
import { describePremise, describeWorld, literalId, models, verdict } from './logic';
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

/** Neutral everyday sentences (ids; wording and negation per language in the `logic` namespace). */
const ATOMS: readonly string[] = [
  'lamp',
  'door',
  'bell',
  'flag',
  'train',
  'box',
  'rain',
  'shop',
  'dog',
  'kettle',
  'gate',
  'radio',
];

export const VERDICT_LABELS: Record<Verdict, Message> = {
  true: msg('logic:conditionalReasoning.verdict.true'),
  false: msg('logic:conditionalReasoning.verdict.false'),
  unknown: msg('logic:conditionalReasoning.verdict.unknown'),
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

const note = (path: string) => msg(`logic:conditionalReasoning.notes.${path}`);

export function explain(content: ConditionalContent, answer: Verdict): Text {
  const atomCount = content.atoms.length;
  const worlds = models(atomCount, content.premises);
  const asked = literalId(content.atoms, content.question);
  const notes: Message[] = [
    ...(content.kind === 'mixed'
      ? content.premises.some((p) => p.type === 'unless')
        ? [note('unless')]
        : []
      : content.kind === 'unless' || content.kind === 'only-if'
        ? [note(content.kind === 'unless' ? 'unless' : 'onlyIf')]
        : []),
    ...(content.premises.some((p) => p.type === 'only-if') && content.kind === 'mixed'
      ? [note('onlyIf')]
      : []),
    ...(content.pattern === 'none' ? [] : [note(content.pattern)]),
  ];
  const holds = (w: readonly boolean[]) => w[content.question.atom] === content.question.value;
  const verdictText =
    answer === 'unknown'
      ? msg('logic:conditionalReasoning.because.unknown', {
          a: asked,
          yes: describeWorld(content.atoms, worlds.find(holds) as boolean[]),
          no: describeWorld(content.atoms, worlds.find((w) => !holds(w)) as boolean[]),
        })
      : msg(`logic:conditionalReasoning.because.${answer}`, { a: asked });
  return joinText([...notes, verdictText], ' ');
}

export const conditionalReasoningGame: GameDefinition<ConditionalChallenge, ConditionalProfile> = {
  id: CONDITIONAL_REASONING_ID,
  name: msg('logic:conditionalReasoning.name'),
  tagline: msg('logic:conditionalReasoning.tagline'),
  description: msg('logic:conditionalReasoning.description'),
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
    scoringSummary: msg('logic:conditionalReasoning.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('logic:conditionalReasoning.instructions.1'),
    msg('logic:conditionalReasoning.instructions.2'),
    msg('logic:conditionalReasoning.instructions.3'),
    msg('logic:conditionalReasoning.instructions.4'),
  ],
  simpleInstructions: msg('logic:conditionalReasoning.simpleInstructions'),
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
      prompt: msg('logic:conditionalReasoning.prompt', {
        a: literalId(atoms, candidate.question),
      }),
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
