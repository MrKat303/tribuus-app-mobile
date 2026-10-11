import { mapWithConcurrency } from './mapWithConcurrency';

describe('mapWithConcurrency', () => {
  test('preserves result order while respecting the concurrency limit', async () => {
    let active = 0;
    let maximumActive = 0;

    const result = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 3, async (value) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, value % 2 === 0 ? 2 : 5));
      active -= 1;
      return value * 2;
    });

    expect(result).toEqual([2, 4, 6, 8, 10, 12]);
    expect(maximumActive).toBe(3);
  });

  test('waits for in-flight work before rejecting and stops scheduling new work', async () => {
    const completed: number[] = [];
    const started: number[] = [];

    await expect(mapWithConcurrency([0, 1, 2], 2, async (value) => {
      started.push(value);
      if (value === 0) throw new Error('failed');
      await new Promise((resolve) => setTimeout(resolve, 5));
      completed.push(value);
      return value;
    })).rejects.toThrow('failed');

    expect(started).toEqual([0, 1]);
    expect(completed).toEqual([1]);
  });
});
