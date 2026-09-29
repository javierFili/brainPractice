import type { AssessmentDefinition } from '@/domain/assessment';
import { createGameRegistry } from '@/domain/game';
import { FakeClock } from '@/test/fakes/FakeClock';
import { FixedSeedSource } from '@/test/fakes/FixedSeedSource';
import { fixtureGame } from '@/test/fixtures/fixtureGame';
import { startAssessment } from './AssessmentEngine';
import { createGameEngine } from './GameEngine';

const definition: AssessmentDefinition = {
  id: 'fixture',
  name: 'Fixture',
  sections: [{ area: 'logic', gameId: 'fixture-max', levels: [2, 6], challengesPerLevel: 2 }],
};

function setup() {
  const clock = new FakeClock();
  const engine = createGameEngine({
    registry: createGameRegistry([fixtureGame]),
    clock,
    seeds: new FixedSeedSource(3, 4),
  });
  return { clock, run: startAssessment(definition, engine, clock) };
}

function playPerfectly(session: ReturnType<ReturnType<typeof setup>['run']['startStep']>) {
  while (session.getState().status !== 'finished') {
    const state = session.getState();
    const challenge = state.challenges[state.index];
    if (!challenge || challenge.response.format !== 'single-choice') throw new Error('unexpected');
    session.present();
    session.submitAnswer({
      format: 'single-choice',
      optionId: challenge.response.solution.optionId,
    });
    session.advance();
  }
  return session.finish();
}

describe('AssessmentRun', () => {
  it('plays each step as a short session of the planned level and scores the profile', () => {
    const { run } = setup();
    expect(run.steps).toHaveLength(2);

    const first = run.startStep();
    expect(first.getState().challenges).toHaveLength(2);
    expect(first.getState().settings.level).toBe(2);
    run.completeStep(playPerfectly(first));
    expect(run.result()).toBeNull();
    expect(run.currentStep()?.level).toBe(6);

    run.completeStep(playPerfectly(run.startStep()));
    expect(run.currentStep()).toBeNull();
    expect(run.result()?.profile.logic).toMatchObject({
      value: 100,
      band: 'exceptional',
      sampleSize: 4,
    });
    expect(run.result()?.steps).toHaveLength(2);
  });

  it('rejects results that do not belong to the current step and extra steps', () => {
    const { run } = setup();
    const session = run.startStep();
    const result = playPerfectly(session);
    expect(() => {
      run.completeStep({ ...result, level: 9 });
    }).toThrow(/does not match/);
    run.completeStep(result);
    run.completeStep(playPerfectly(run.startStep()));
    expect(() => run.startStep()).toThrow(/complete/);
    expect(() => {
      run.completeStep(result);
    }).toThrow(/complete/);
  });
});
