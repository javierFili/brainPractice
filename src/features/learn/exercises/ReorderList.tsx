import type { ChoiceOption } from '@/domain/challenge';
import { Button } from '@/components/ui/Button';
import { plainText } from '../text';

/** Keyboard-accessible list with move/remove buttons (no drag and drop required). */
export function ReorderList({
  items,
  locked,
  label,
  onMove,
  onRemove,
}: {
  items: readonly ChoiceOption[];
  locked: boolean;
  label: string;
  onMove: (index: number, delta: -1 | 1) => void;
  onRemove?: (index: number) => void;
}) {
  return (
    <ol className="flex flex-col gap-2" aria-label={label}>
      {items.map((item, i) => (
        <li
          key={item.id}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
        >
          <span className="w-6 font-mono text-xs text-slate-500">{i + 1}.</span>
          <span className="flex-1 font-mono text-sm whitespace-pre-wrap">
            {plainText(item.label)}
          </span>
          {!locked && (
            <span className="flex gap-1">
              <Button
                variant="ghost"
                className="px-2 py-1"
                disabled={i === 0}
                aria-label={`Move ${plainText(item.label).trim()} up`}
                onClick={() => {
                  onMove(i, -1);
                }}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-1"
                disabled={i === items.length - 1}
                aria-label={`Move ${plainText(item.label).trim()} down`}
                onClick={() => {
                  onMove(i, 1);
                }}
              >
                ↓
              </Button>
              {onRemove && (
                <Button
                  variant="ghost"
                  className="px-2 py-1"
                  aria-label={`Remove ${plainText(item.label).trim()}`}
                  onClick={() => {
                    onRemove(i);
                  }}
                >
                  ✕
                </Button>
              )}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
