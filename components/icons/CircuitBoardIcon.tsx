export default function CircuitBoardIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
    >
      {/* Horizontal traces */}
      <path d="M2 8h5l2-2h6l2 2h5" />
      <path d="M2 16h3l2 2h4l2-2h2l2 2h5" />
      {/* Vertical traces */}
      <path d="M8 4v4" strokeOpacity="0.6" />
      <path d="M16 4v4" strokeOpacity="0.6" />
      <path d="M6 16v4" strokeOpacity="0.6" />
      <path d="M14 12v4" strokeOpacity="0.6" />
      <path d="M18 16v4" strokeOpacity="0.6" />
      {/* Junction dots */}
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="16" r="1" fill="currentColor" stroke="none" />
      {/* Center connection */}
      <path d="M8 8v3h6v5" strokeOpacity="0.4" />
    </svg>
  );
}
