import type { ReactNode } from 'react';
import type { ChoiceOption } from '@/domain/challenge';
import { parseGlyph } from '../content/parseGlyph';
import { GlyphOption } from './GlyphOption';

/** Option face: the glyph next to its name; number options render as plain text. */
export function renderRuleOption(option: ChoiceOption): ReactNode {
  const glyph = parseGlyph(option.label);
  if (!glyph) return undefined;
  return <GlyphOption glyph={glyph} />;
}
