import type { Exercise, ExerciseAnswer, ExerciseKind } from '@/domain/learning';
import type { ComponentType } from 'react';
import { BlockBuilderView } from './BlockBuilderView';
import { CodeCompletionView } from './CodeCompletionView';
import { DebuggingView } from './DebuggingView';
import { MatchingView } from './MatchingView';
import { MultipleChoiceView } from './MultipleChoiceView';
import { OrderingView } from './OrderingView';
import { PredictionView } from './PredictionView';
import type { ExerciseViewProps } from './types';

const VIEWS: { readonly [K in ExerciseKind]: ComponentType<ExerciseViewProps<K>> } = {
  'multiple-choice': MultipleChoiceView,
  prediction: PredictionView,
  'code-completion': CodeCompletionView,
  ordering: OrderingView,
  'block-builder': BlockBuilderView,
  matching: MatchingView,
  debugging: DebuggingView,
};

/** Exhaustive dispatch from exercise kind to its renderer (like games' ContentView). */
export function ExerciseView({
  exercise,
  locked,
  showSolution,
  onSubmit,
}: {
  exercise: Exercise;
  locked: boolean;
  showSolution: boolean;
  onSubmit: (answer: ExerciseAnswer) => void;
}) {
  const View = VIEWS[exercise.kind] as ComponentType<ExerciseViewProps<ExerciseKind>>;
  return (
    <View exercise={exercise} locked={locked} showSolution={showSolution} onSubmit={onSubmit} />
  );
}
