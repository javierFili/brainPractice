import { OBJECTS } from '@/games/kit/content';
import { glyphLabel } from '@/games/kit/content';
import { Glyph, ObjectFace, PairsBoard } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import type { CardFace, MemoryCardsChallenge } from '../content/types';

const byId = new Map(OBJECTS.map((o) => [o.id, o]));

function face(card: CardFace) {
  if (card.type === 'glyph') {
    return {
      label: glyphLabel(card.glyph),
      content: <Glyph glyph={card.glyph} decorative className="h-3/5 w-3/5" />,
    };
  }
  const item = byId.get(card.objectId);
  if (!item) throw new Error(`Unknown object ${card.objectId}`);
  return {
    label: item.label,
    content: <ObjectFace item={item} className="text-3xl sm:text-4xl" />,
  };
}

export function MemoryCardsView({
  challenge,
  phase,
  respond,
  answer,
}: ContentViewProps<MemoryCardsChallenge>) {
  const { response, content } = challenge;
  if (response.format !== 'pairs') throw new Error('Memory Cards uses the pairs format');
  return (
    <PairsBoard
      response={response}
      faces={content.faces.map(face)}
      columns={content.columns}
      respond={respond}
      answer={answer}
      revealAll={phase === 'study'}
    />
  );
}
