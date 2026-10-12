export type SubmissionDisposition = 'accepted' | 'rejected' | 'retry';

export function classifySubmissionStatus(status: string): SubmissionDisposition {
  if (status === 'PENDING' || status === 'DUPLICATE') return 'accepted';
  if (status === 'ERROR') return 'rejected';
  return 'retry';
}
