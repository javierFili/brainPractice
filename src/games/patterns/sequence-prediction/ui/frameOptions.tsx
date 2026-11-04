import type { ChoiceOption } from '@/domain/challenge';
import { frameFromText } from '../content/frames';
import { FrameGrid } from './FrameGrid';

/** Draws a frame option; its label (the frame in words) stays the accessible name. */
export function renderFrameOption(option: ChoiceOption) {
  const parsed = frameFromText(option.label);
  return parsed === null ? undefined : (
    <FrameGrid frame={parsed.frame} size={parsed.size} decorative />
  );
}
