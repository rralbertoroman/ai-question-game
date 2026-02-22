'use client';
import ErrorBoundaryFallback from '@/components/error/ErrorBoundaryFallback';
export default function ResultsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="Error de Resultados"
      description="No se pudieron cargar los resultados del juego. Por favor, inténtalo de nuevo."
    />
  );
}
