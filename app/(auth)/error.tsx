'use client';
import ErrorBoundaryFallback from '@/components/error/ErrorBoundaryFallback';
export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="Authentication Error"
      description="There was a problem with the authentication page. Please try again."
    />
  );
}
