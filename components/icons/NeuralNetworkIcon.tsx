export default function NeuralNetworkIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      {/* Input layer nodes */}
      <circle cx="4" cy="8" r="2" />
      <circle cx="4" cy="16" r="2" />
      {/* Hidden layer nodes */}
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
      {/* Output layer nodes */}
      <circle cx="20" cy="8" r="2" />
      <circle cx="20" cy="16" r="2" />
      {/* Connections: input → hidden */}
      <line x1="6" y1="8" x2="10" y2="5" strokeOpacity="0.4" />
      <line x1="6" y1="8" x2="10" y2="12" strokeOpacity="0.4" />
      <line x1="6" y1="8" x2="10" y2="19" strokeOpacity="0.4" />
      <line x1="6" y1="16" x2="10" y2="5" strokeOpacity="0.4" />
      <line x1="6" y1="16" x2="10" y2="12" strokeOpacity="0.4" />
      <line x1="6" y1="16" x2="10" y2="19" strokeOpacity="0.4" />
      {/* Connections: hidden → output */}
      <line x1="14" y1="5" x2="18" y2="8" strokeOpacity="0.4" />
      <line x1="14" y1="5" x2="18" y2="16" strokeOpacity="0.4" />
      <line x1="14" y1="12" x2="18" y2="8" strokeOpacity="0.4" />
      <line x1="14" y1="12" x2="18" y2="16" strokeOpacity="0.4" />
      <line x1="14" y1="19" x2="18" y2="8" strokeOpacity="0.4" />
      <line x1="14" y1="19" x2="18" y2="16" strokeOpacity="0.4" />
    </svg>
  );
}
