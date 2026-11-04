import { retryGeneration, type GameDefinition } from '@/domain/game';
import {
  pick,
  randomInt,
  sample,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { gameIdOf, joinText, msg } from '@/domain/shared';
import { PEOPLE, textChoice, type Draft } from '@/games/logic/shared/content';
import { CATEGORIES, CATEGORY_IDS, categorySentence, valueLabel } from './categories';
import { LOGICAL_DEDUCTION_LEVELS } from './levels';
import { filterTables, indexedTables, minimizeClues, tableAt, type Table } from './solver';
import type {
  ClueType,
  DeductionChallenge,
  DeductionClue,
  DeductionContent,
  DeductionProfile,
} from './types';

export const LOGICAL_DEDUCTION_ID = gameIdOf('logical-deduction');

const MAX_CLUES = 14;

/** A random clue of the given type that is true for `target`, or null when the type cannot apply. */
function clueFor(
  random: RandomGenerator,
  type: ClueType,
  target: Table,
  people: number,
): DeductionClue | null {
  const categories = target.length;
  const category = randomInt(random, 0, categories - 1);
  const person = randomInt(random, 0, people - 1);
  const own = target[category]?.[person] as number;
  const other = () =>
    pick(
      random,
      [...Array(people).keys()].filter((v) => v !== own),
    );
  switch (type) {
    case 'is':
      return { type, person, category, value: own };
    case 'is-not':
      return { type, person, category, value: other() };
    case 'either': {
      const values = shuffle(random, [own, other()]) as [number, number];
      return { type, person, category, values };
    }
    case 'link':
    case 'not-link': {
      if (categories < 2) return null;
      const [catA, catB] = sample(random, [...Array(categories).keys()], 2) as [number, number];
      const a = target[catA]?.[person] as number;
      const ownB = target[catB]?.[person] as number;
      const b =
        type === 'link'
          ? ownB
          : pick(
              random,
              [...Array(people).keys()].filter((v) => v !== ownB),
            );
      return { type, catA, a, catB, b };
    }
  }
}

interface Puzzle {
  readonly target: Table;
  readonly clues: DeductionClue[];
}

/**
 * Adds true clues while they cut down the possible tables until exactly one remains, then drops
 * every clue the others make redundant. Bit sets keep each uniqueness check cheap.
 */
function buildPuzzle(random: RandomGenerator, profile: DeductionProfile): Puzzle | null {
  const ix = indexedTables(profile.people, profile.categories);
  const target = tableAt(ix, randomInt(random, 0, ix.size - 1));
  const clues: DeductionClue[] = [];
  let left: Int32Array = ix.all;
  for (let i = 0; i < 80 && left.length > 1; i++) {
    const clue = clueFor(random, weightedPick(random, profile.clueTypes), target, profile.people);
    if (!clue) continue;
    const next = filterTables(ix, left, clue);
    if (next.length < left.length) {
      clues.push(clue);
      left = next;
    }
  }
  if (left.length !== 1) return null;
  const needed = minimizeClues(ix, clues);
  if (needed.length > MAX_CLUES) return null;
  return { target, clues: shuffle(random, needed) };
}

export const logicalDeductionGame: GameDefinition<DeductionChallenge, DeductionProfile> = {
  id: LOGICAL_DEDUCTION_ID,
  name: msg('logic:logicalDeduction.name'),
  tagline: msg('logic:logicalDeduction.tagline'),
  description: msg('logic:logicalDeduction.description'),
  area: 'logic',
  skills: ['logical-reasoning', 'problem-solving', 'working-memory'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('logic:logicalDeduction.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('logic:logicalDeduction.instructions.items'),
    msg('logic:logicalDeduction.instructions.clues'),
    msg('logic:logicalDeduction.instructions.ruleOut'),
    msg('logic:logicalDeduction.instructions.tip'),
  ],
  simpleInstructions: msg('logic:logicalDeduction.simpleInstructions'),
  levels: LOGICAL_DEDUCTION_LEVELS,
  generate({ identity, profile, random }) {
    const { target, clues } = retryGeneration('deduction puzzle', () =>
      buildPuzzle(random, profile),
    );
    const people = sample(random, PEOPLE, profile.people).sort();
    const categories = sample(random, CATEGORY_IDS, profile.categories).map((id) => ({
      id,
      values: sample(random, CATEGORIES[id].values, profile.people),
    }));
    const base = { people, categories };
    // Prefer a fact that no clue states outright, so the answer has to be deduced.
    const stated = new Set(
      clues.flatMap((c) => (c.type === 'is' ? [`${c.category}:${c.person}`] : [])),
    );
    const facts = categories
      .flatMap((_, category) => people.map((__, person) => ({ category, person })))
      .filter((f) => !stated.has(`${f.category}:${f.person}`));
    const fact = pick(random, facts.length > 0 ? facts : [{ category: 0, person: 0 }]);
    const value = target[fact.category]?.[fact.person] as number;
    const category = categories[fact.category] as DeductionContent['categories'][number];
    const valueName = category.values[value] as string;
    const personName = people[fact.person] as string;
    const askWho = random.next() < 0.5;
    const question: DeductionContent['question'] = askWho
      ? { type: 'who', category: fact.category, value }
      : { type: 'what', category: fact.category, person: fact.person };
    const response = askWho
      ? textChoice(
          random,
          personName,
          people.filter((p) => p !== personName),
        )
      : textChoice(
          random,
          valueLabel(category.id, valueName),
          category.values.filter((v) => v !== valueName).map((v) => valueLabel(category.id, v)),
        );
    const rows = people.map((person, p) =>
      msg('logic:logicalDeduction.row', {
        person,
        values: joinText(
          categories.map((cat, c) =>
            valueLabel(cat.id, cat.values[target[c]?.[p] as number] as string),
          ),
          ', ',
        ),
      }),
    );
    const content: DeductionContent = {
      kind: profile.categories === 1 ? 'single-category' : 'multi-category',
      ...base,
      clues,
      solution: target,
      question,
    };
    const draft: Draft<DeductionChallenge> = {
      prompt: askWho
        ? categorySentence(category.id, 'askWho', { value: valueName })
        : categorySentence(category.id, 'askWhat', { person: personName }),
      content,
      response,
      explanation: msg('logic:logicalDeduction.explanation', {
        count: clues.length,
        rows: joinText(rows, '; '),
        fact: categorySentence(category.id, 'is', { subject: personName, value: valueName }),
      }),
      skills:
        profile.categories === 1
          ? ['logical-reasoning', 'problem-solving']
          : ['logical-reasoning', 'working-memory', 'problem-solving'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
