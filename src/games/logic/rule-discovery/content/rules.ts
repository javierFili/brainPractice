import { msg, type Message } from '@/domain/shared';
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

const key = (path: string) => `logic:ruleDiscovery.${path}`;

/** "even", "in the 3 times table", "greater than 40". */
export function describeNumberTest(test: NumberTest): Message {
  switch (test.type) {
    case 'even':
    case 'odd':
      return msg(key(`test.${test.type}`));
    case 'multiple':
      return msg(key('test.multiple'), { of: test.of });
    case 'greater':
    case 'less':
      return msg(key(`test.${test.type}`), { than: test.than });
    case 'ends-in':
      return msg(key('test.endsIn'), { digit: String(test.digit) });
  }
}

/**
 * The rule in words. Colour and shape ids are interpolated and each language nests the right
 * colour form and article itself (`$t(kit:colorForm.f.{{color}})`), so nothing agrees in code.
 */
export function describeRule(rule: GlyphRule | NumberRule): Message {
  switch (rule.type) {
    case 'color':
    case 'not-color':
      return msg(key(`rule.${rule.type === 'color' ? 'color' : 'notColor'}`), {
        color: rule.color,
      });
    case 'shape':
    case 'not-shape':
      return msg(key(`rule.${rule.type === 'shape' ? 'shape' : 'notShape'}`), {
        shape: rule.shape,
      });
    case 'color-or-shape':
      return msg(key('rule.colorOrShape'), { color: rule.color, shape: rule.shape });
    case 'and':
      return msg(key('rule.and'), {
        a: describeNumberTest(rule.a),
        b: describeNumberTest(rule.b),
      });
    default:
      return msg(key('rule.number'), { test: describeNumberTest(rule) });
  }
}
