export default function AiChipIcon({ className, size = 24 }: { className?: string; size?: number }) {
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
      {/* Chip body */}
      <rect x="6" y="6" width="12" height="12" rx="1" />
      {/* Inner die */}
      <rect x="9" y="9" width="6" height="6" rx="0.5" strokeOpacity="0.5" />
      {/* Top pins */}
      <line x1="9" y1="6" x2="9" y2="3" />
      <line x1="12" y1="6" x2="12" y2="3" />
      <line x1="15" y1="6" x2="15" y2="3" />
      {/* Bottom pins */}
      <line x1="9" y1="18" x2="9" y2="21" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="15" y1="18" x2="15" y2="21" />
      {/* Left pins */}
      <line x1="6" y1="9" x2="3" y2="9" />
      <line x1="6" y1="12" x2="3" y2="12" />
      <line x1="6" y1="15" x2="3" y2="15" />
      {/* Right pins */}
      <line x1="18" y1="9" x2="21" y2="9" />
      <line x1="18" y1="12" x2="21" y2="12" />
      <line x1="18" y1="15" x2="21" y2="15" />
      {/* AI text in center */}
      <text
        x="12"
        y="13.5"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="4"
        fontWeight="bold"
        fontFamily="monospace"
      >
        AI
      </text>
    </svg>
  );
}
