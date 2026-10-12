export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('La concurrencia debe ser un entero mayor que cero.');
  }

  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let hasError = false;
  let firstError: unknown;

  async function worker() {
    while (!hasError) {
      const index = nextIndex;
      if (index >= items.length) return;
      nextIndex += 1;

      try {
        results[index] = await mapper(items[index], index);
      } catch (error) {
        hasError = true;
        firstError = error;
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (hasError) throw firstError;
  return results;
}
