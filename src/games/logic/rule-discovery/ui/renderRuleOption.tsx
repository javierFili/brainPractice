import type { ReactNode } from 'react';
import type { ChoiceOption } from '@/domain/challenge';
import { Glyph as GlyphIcon } from '@/games/kit/ui';
import { parseGlyph } from '../content/parseGlyph';

/** Option face: the glyph next to its name; number options render as plain text. */
export function renderRuleOption(option: ChoiceOption): ReactNode {
  const glyph = parseGlyph(option.label);
  if (!glyph) return undefined;
  return (
    <span className="inline-flex items-center gap-2">
      <GlyphIcon glyph={glyph} decorative className="h-8 w-8" />
      <span>{option.label}</span>
    </span>
  );
}
