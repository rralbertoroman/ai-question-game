interface Props {
  message: string | null | undefined;
  className?: string;
  onDismiss?: () => void;
}

export default function InlineError({ message, className = '', onDismiss }: Props) {
  if (!message) return null;
  return (
    <div className={`p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm flex items-center justify-between ${className}`}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 text-red-400/60 hover:text-red-400 text-lg leading-none cursor-pointer" aria-label="Dismiss error">
          {'\u00D7'}
        </button>
      )}
    </div>
  );
}
