'use client';
import type { ToastItem } from './useToast';

const typeStyles: Record<string, string> = {
  error: 'border-red-500/50 bg-red-500/10 text-red-400',
  success: 'border-green-500/50 bg-green-500/10 text-green-400',
  info: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
};

export default function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  return (
    <div className={`pointer-events-auto px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg animate-fade-in-up max-w-sm text-sm ${typeStyles[toast.type]}`}>
      <div className="flex items-center justify-between gap-3">
        <span>{toast.message}</span>
        <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100 text-lg leading-none cursor-pointer shrink-0" aria-label="Dismiss">{'\u00D7'}</button>
      </div>
    </div>
  );
}
