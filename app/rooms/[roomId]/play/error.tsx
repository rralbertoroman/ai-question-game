'use client';
import ErrorBoundaryFallback from '@/components/error/ErrorBoundaryFallback';
export default function PlayError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="Error del Juego"
      description="Algo salió mal durante el juego. Intenta de nuevo para reconectarte."
    />
  );
}
