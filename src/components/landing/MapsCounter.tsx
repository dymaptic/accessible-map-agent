"use client";

import { useEffect, useState } from "react";

export function MapsCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/public");
        if (res.ok) {
          const data = await res.json();
          setCount(data.totalMapsAccessible);
        }
      } catch {
        // Silently fail - counter just won't show
      }
    }
    fetchStats();
  }, []);

  // Don't show anything until we have a count, and only show if > 0
  if (count === null || count === 0) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-3 text-gray-300">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-teal-light"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <span className="text-2xl font-bold text-white tabular-nums">
          {count.toLocaleString()}
        </span>
        <span className="text-gray-400">maps made accessible</span>
      </div>
    </div>
  );
}
