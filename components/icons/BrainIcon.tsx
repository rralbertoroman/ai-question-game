export default function BrainIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left hemisphere */}
      <path d="M12 2C9.5 2 7.5 3.5 7 5.5C5.5 5.5 4 7 4 9c0 1.5.8 2.8 2 3.5-.2.5-.3 1-.3 1.5 0 2 1.5 3.5 3.3 3.8.5 1.3 1.7 2.2 3 2.2" />
      {/* Right hemisphere */}
      <path d="M12 2c2.5 0 4.5 1.5 5 3.5 1.5 0 3 1.5 3 3.5 0 1.5-.8 2.8-2 3.5.2.5.3 1 .3 1.5 0 2-1.5 3.5-3.3 3.8-.5 1.3-1.7 2.2-3 2.2" />
      {/* Center line */}
      <path d="M12 2v18" strokeOpacity="0.4" />
      {/* Neural connections */}
      <path d="M8 8h2" strokeOpacity="0.6" />
      <path d="M14 8h2" strokeOpacity="0.6" />
      <path d="M7 12h3" strokeOpacity="0.6" />
      <path d="M14 12h3" strokeOpacity="0.6" />
      <path d="M8 16h2" strokeOpacity="0.6" />
      <path d="M14 16h2" strokeOpacity="0.6" />
    </svg>
  );
}
