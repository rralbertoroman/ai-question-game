import { AiChipIcon } from '@/components/icons';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <AiChipIcon size={28} className="text-cyan-400 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gradient-animated leading-tight">
            Avangenio AI Challenge
          </h1>
          <p className="text-xs text-gray-500 leading-tight">
            Día Tecnológico: AI
          </p>
        </div>
      </div>
    </header>
  );
}
