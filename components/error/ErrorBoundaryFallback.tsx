'use client';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

export default function ErrorBoundaryFallback({ error, reset, title = 'Something went wrong', description }: Props) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-gray-800/70 border border-red-500/30 rounded-lg text-center animate-fade-in-up">
        {/* Warning icon */}
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm mb-6">{description || 'An unexpected error occurred. Please try again.'}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mb-4 p-3 bg-gray-900 rounded text-xs text-red-300 text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded transition-colors cursor-pointer">
            Try Again
          </button>
          <a href="/" className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
