import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResponseOf } from '@/domain/challenge';
import { useText } from '@/i18n';
import { Button } from '../ui/Button';

interface Props {
  readonly response: ResponseOf<'ordering'>;
  readonly disabled: boolean;
  readonly onSubmit: (order: readonly string[]) => void;
}

/** Keyboard-accessible reordering with explicit move buttons (no drag and drop required). */
export function OrderingResponse({ response, disabled, onSubmit }: Props) {
  const [order, setOrder] = useState(() => response.question.items.map((item) => item.id));
  const { t } = useTranslation();
  const tx = useText();
  const label = (id: string) => {
    const item = response.question.items.find((entry) => entry.id === id);
    return item ? tx(item.label) : id;
  };

  const move = (index: number, delta: -1 | 1) => {
    setOrder((current) => {
      const next = [...current];
      const target = index + delta;
      [next[index], next[target]] = [next[target] as string, next[index] as string];
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2" aria-label={t('response.yourOrder')}>
        {order.map((id, i) => (
          <li
            key={id}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          >
            <span className="w-6 font-mono text-xs text-slate-500">{i + 1}.</span>
            <span className="flex-1 font-mono text-sm">{label(id)}</span>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={disabled || i === 0}
              aria-label={t('response.moveUp', { item: label(id) })}
              onClick={() => {
                move(i, -1);
              }}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={disabled || i === order.length - 1}
              aria-label={t('response.moveDown', { item: label(id) })}
              onClick={() => {
                move(i, 1);
              }}
            >
              ↓
            </Button>
          </li>
        ))}
      </ol>
      <div>
        <Button
          disabled={disabled}
          onClick={() => {
            onSubmit(order);
          }}
        >
          {t('response.submitOrder')}
        </Button>
      </div>
    </div>
  );
}
