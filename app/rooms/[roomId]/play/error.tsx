'use client';
import ErrorBoundaryFallback from '@/components/error/ErrorBoundaryFallback';
export default function PlayError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="Game Error"
      description="Something went wrong during the game. Try again to reconnect."
    />
  );
}
