'use client';
import ErrorBoundaryFallback from '@/components/error/ErrorBoundaryFallback';
export default function SuperviseError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="Supervision Error"
      description="Could not load the supervision view. Please try again."
    />
  );
}
