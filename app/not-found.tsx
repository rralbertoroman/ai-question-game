import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-gray-800/70 border border-gray-700 rounded-lg text-center animate-fade-in-up">
        <div className="text-6xl font-bold text-cyan-400 mb-4">404</div>
        <h2 className="text-xl font-bold text-white mb-2">Página No Encontrada</h2>
        <p className="text-gray-400 text-sm mb-6">La página que buscas no existe.</p>
        <Link href="/" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded transition-colors inline-block">
          Ir al Inicio
        </Link>
      </div>
    </div>
  );
}
