'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  callback: () => Promise<void>;
  intervalMs: number;
  enabled?: boolean;
}

interface UsePollingResult {
  trigger: () => void;
}

export function usePolling({
  callback,
  intervalMs,
  enabled = true,
}: UsePollingOptions): UsePollingResult {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  // Always keep the latest callback without restarting the interval
  callbackRef.current = callback;

  const runCallback = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      await callbackRef.current();
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(runCallback, intervalMs);
  }, [runCallback, intervalMs]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manual trigger that resets the interval
  const trigger = useCallback(() => {
    runCallback();
    if (enabled) startInterval();
  }, [runCallback, enabled, startInterval]);

  // Main effect: start/stop polling based on enabled flag
  useEffect(() => {
    if (!enabled) {
      stopInterval();
      return;
    }

    // Initial fetch + start interval
    runCallback();
    startInterval();

    return stopInterval;
  }, [enabled, runCallback, startInterval, stopInterval]);

  // Pause when tab is hidden
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        // Fetch immediately on tab focus, then restart interval
        runCallback();
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, runCallback, startInterval, stopInterval]);

  return { trigger };
}
