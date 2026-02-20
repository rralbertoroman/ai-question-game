import { CircuitBoardIcon } from '@/components/icons';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          {/* Branding */}
          <div className="flex items-start gap-2">
            <CircuitBoardIcon size={20} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Avangenio AI Challenge</p>
              <p className="text-gray-500 text-xs mt-1">
                &copy; {new Date().getFullYear()} Avangenio
              </p>
            </div>
          </div>

          {/* Event info */}
          <div className="text-center">
            <p className="font-semibold text-cyan-400">Día Tecnológico: AI</p>
            <p className="text-gray-500 text-xs mt-1">
              Test your AI &amp; LLM knowledge
            </p>
          </div>

          {/* Tech credits */}
          <div className="text-right">
            <p className="text-gray-500 text-xs">
              Built with Next.js, TypeScript &amp; PostgreSQL
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Powered by Avangenio
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
