/**
 * Centralized error handler — returns safe, user-facing messages.
 * Never exposes raw DB errors, SQL errors, or stack traces.
 */
export function getDisplayError(error: unknown): string {
  console.error('Operation failed:', error);

  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const lower = msg.toLowerCase();

  if (lower.includes('duplicate key') || lower.includes('already exists')) {
    return 'This record already exists. Please check for duplicates.';
  }
  if (lower.includes('foreign key') || lower.includes('violates foreign key')) {
    return 'This record is linked to other data and cannot be modified this way.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'The operation took too long. Please try again.';
  }
  if (lower.includes('unauthorized') || lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (lower.includes('permission') || lower.includes('denied') || lower.includes('rls')) {
    return 'You do not have permission to perform this action.';
  }

  return 'Unable to complete this operation. Please try again.';
}
