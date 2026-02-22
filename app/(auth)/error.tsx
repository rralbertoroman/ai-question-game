'use client';
import ErrorBoundaryFallback from '@/components/error/ErrorBoundaryFallback';
export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="Error de Autenticación"
      description="Hubo un problema con la página de autenticación. Por favor, inténtalo de nuevo."
    />
  );
}
