'use client';

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const fraction = current / total;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400">
          Question {current} of {total}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(fraction * 100)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 ease-out rounded-full progress-bar-shimmer"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
