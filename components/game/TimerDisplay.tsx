'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  serverTimeRemainingMs: number;
  totalSeconds: number;
}

export default function TimerDisplay({
  serverTimeRemainingMs,
  totalSeconds,
}: Props) {
  const [displayMs, setDisplayMs] = useState(serverTimeRemainingMs);
  const lastSyncRef = useRef(Date.now());

  // Resync when server value changes
  useEffect(() => {
    setDisplayMs(serverTimeRemainingMs);
    lastSyncRef.current = Date.now();
  }, [serverTimeRemainingMs]);

  // Smooth countdown between polls
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastSyncRef.current;
      const remaining = Math.max(0, serverTimeRemainingMs - elapsed);
      setDisplayMs(remaining);
    }, 100);
    return () => clearInterval(interval);
  }, [serverTimeRemainingMs]);

  const seconds = Math.ceil(displayMs / 1000);
  const fraction = displayMs / (totalSeconds * 1000);

  let colorClass = 'text-cyan-400';
  let barColor = 'bg-cyan-500';
  if (seconds <= 5) {
    colorClass = 'text-red-400 animate-pulse';
    barColor = 'bg-red-500';
  } else if (seconds <= 10) {
    colorClass = 'text-yellow-400';
    barColor = 'bg-yellow-500';
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Time
        </span>
        <span className={`text-2xl font-mono font-bold ${colorClass}`}>
          {seconds}s
        </span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className={`h-full ${barColor} transition-all duration-100 ease-linear rounded-full`}
          style={{ width: `${Math.max(0, fraction * 100)}%` }}
        />
      </div>
    </div>
  );
}
