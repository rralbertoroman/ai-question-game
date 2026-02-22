'use client';
import ErrorBoundaryFallback from '@/components/error/ErrorBoundaryFallback';
export default function SuperviseError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="Error de Supervisión"
      description="No se pudo cargar la vista de supervisión. Por favor, inténtalo de nuevo."
    />
  );
}
