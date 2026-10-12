import { classifySubmissionStatus } from './stellar-status.ts';

function expectEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`);
}

Deno.test('accepts pending and duplicate submissions', () => {
  expectEqual(classifySubmissionStatus('PENDING'), 'accepted');
  expectEqual(classifySubmissionStatus('DUPLICATE'), 'accepted');
});

Deno.test('rejects definitive Stellar errors', () => {
  expectEqual(classifySubmissionStatus('ERROR'), 'rejected');
});

Deno.test('retries temporary and unknown statuses conservatively', () => {
  expectEqual(classifySubmissionStatus('TRY_AGAIN_LATER'), 'retry');
  expectEqual(classifySubmissionStatus('unexpected'), 'retry');
});
