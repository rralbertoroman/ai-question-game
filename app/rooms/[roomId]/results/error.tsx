'use client';
import ErrorBoundaryFallback from '@/components/error/ErrorBoundaryFallback';
export default function ResultsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="Results Error"
      description="Could not load the game results. Please try again."
    />
  );
}
