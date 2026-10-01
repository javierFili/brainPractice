import { tracked } from './composition';

describe('tracked', () => {
  it('records the outcome on the promise so use() can read it synchronously', async () => {
    const ok = tracked(Promise.resolve(42)) as Promise<number> & {
      status?: string;
      value?: number;
    };
    expect(ok.status).toBe('pending');
    await ok;
    expect(ok).toMatchObject({ status: 'fulfilled', value: 42 });
    expect(tracked(ok)).toBe(ok);

    const failing = tracked(Promise.reject(new Error('x'))) as Promise<never> & { status?: string };
    await expect(failing).rejects.toThrow('x');
    expect(failing.status).toBe('rejected');
  });
});
