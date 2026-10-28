import type { ChoiceOption } from '@/domain/challenge';
import { frameWords, parseFrame } from '../content/frames';
import { FrameGrid } from './FrameGrid';

export function renderFrameOption(option: ChoiceOption) {
  const parsed = parseFrame(option.label);
  return parsed === null ? undefined : (
    <FrameGrid frame={parsed.frame} size={parsed.size} decorative />
  );
}

export function describeFrameOption(label: string) {
  const parsed = parseFrame(label);
  return parsed === null ? undefined : frameWords(parsed.frame);
}
