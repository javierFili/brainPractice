import { ALL_GLYPHS, COLORS, SHAPES, type Glyph } from '@/games/kit/content';
import type { GlyphFamily, GlyphRule, NumberFamily, NumberRule, NumberTest } from './types';

export function glyphFits(rule: GlyphRule, g: Glyph): boolean {
  switch (rule.type) {
    case 'color':
      return g.color === rule.color;
    case 'shape':
      return g.shape === rule.shape;
    case 'not-color':
      return g.color !== rule.color;
    case 'not-shape':
      return g.shape !== rule.shape;
    case 'color-or-shape':
      return g.color === rule.color || g.shape === rule.shape;
  }
}

export function numberFits(rule: NumberRule, n: number): boolean {
  switch (rule.type) {
    case 'even':
      return n % 2 === 0;
    case 'odd':
      return n % 2 === 1;
    case 'multiple':
      return n % rule.of === 0;
    case 'greater':
      return n > rule.than;
    case 'less':
      return n < rule.than;
    case 'ends-in':
      return n % 10 === rule.digit;
    case 'and':
      return numberFits(rule.a, n) && numberFits(rule.b, n);
  }
}

export const NUMBERS = Array.from({ length: 99 }, (_, i) => i + 1);
export const GLYPHS = ALL_GLYPHS;

const THRESHOLDS = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const MULTIPLES = [3, 4, 5];

export function glyphRules(family: GlyphFamily): GlyphRule[] {
  switch (family) {
    case 'color':
    case 'not-color':
      return COLORS.map((color) => ({ type: family, color }));
    case 'shape':
    case 'not-shape':
      return SHAPES.map((shape) => ({ type: family, shape }));
    case 'color-or-shape':
      return COLORS.flatMap((color) => SHAPES.map((shape) => ({ type: family, color, shape })));
  }
}

const simpleTests = (family: Exclude<NumberFamily, 'and'>): NumberTest[] => {
  switch (family) {
    case 'parity':
      return [{ type: 'even' }, { type: 'odd' }];
    case 'multiple':
      return MULTIPLES.map((of) => ({ type: 'multiple', of }));
    case 'greater':
      return THRESHOLDS.map((than) => ({ type: 'greater', than }));
    case 'less':
      return THRESHOLDS.map((than) => ({ type: 'less', than }));
    case 'ends-in':
      return Array.from({ length: 10 }, (_, digit) => ({ type: 'ends-in', digit }));
  }
};

export function numberRules(family: NumberFamily): NumberRule[] {
  if (family !== 'and') return simpleTests(family);
  const kinds = [...simpleTests('parity'), ...simpleTests('multiple')];
  const ranges = [...simpleTests('greater'), ...simpleTests('less')];
  return kinds.flatMap((a) => ranges.map((b) => ({ type: 'and' as const, a, b })));
}

export function describeNumberTest(test: NumberTest): string {
  switch (test.type) {
    case 'even':
      return 'even';
    case 'odd':
      return 'odd';
    case 'multiple':
      return `in the ${test.of} times table`;
    case 'greater':
      return `greater than ${test.than}`;
    case 'less':
      return `less than ${test.than}`;
    case 'ends-in':
      return `ending in ${test.digit}`;
  }
}

export function describeRule(rule: GlyphRule | NumberRule): string {
  switch (rule.type) {
    case 'color':
      return `the shape is ${rule.color}`;
    case 'shape':
      return `the shape is a ${rule.shape}`;
    case 'not-color':
      return `the shape is not ${rule.color}`;
    case 'not-shape':
      return `the shape is not a ${rule.shape}`;
    case 'color-or-shape':
      return `the shape is ${rule.color}, or it is a ${rule.shape} (or both)`;
    case 'and':
      return `the number is ${describeNumberTest(rule.a)} and ${describeNumberTest(rule.b)}`;
    default:
      return `the number is ${describeNumberTest(rule)}`;
  }
}
