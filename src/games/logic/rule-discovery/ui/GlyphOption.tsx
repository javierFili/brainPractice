import type { Glyph } from '@/games/kit/content';
import { glyphLabel } from '@/games/kit/content';
import { Glyph as GlyphIcon } from '@/games/kit/ui';
import { useText } from '@/i18n';

/** A glyph option: the shape next to its name in the current language. */
export function GlyphOption({ glyph }: { readonly glyph: Glyph }) {
  const tx = useText();
  return (
    <span className="inline-flex items-center gap-2">
      <GlyphIcon glyph={glyph} decorative className="h-8 w-8" />
      <span>{tx(glyphLabel(glyph))}</span>
    </span>
  );
}
