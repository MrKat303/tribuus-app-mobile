export function feedErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No fue posible sincronizar el feed.';
}
