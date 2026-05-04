"use client";

import { useEffect, useState } from "react";
import { CircuitBreaker } from "@/components/CircuitBreaker";

export function CircuitBreakerAlert() {
  const [data, setData] = useState<{
    dailyResult: number;
    dailyLossLimit: number | null;
    tradesCount: number;
    maxEntries: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, tradesRes] = await Promise.all([
          fetch("/api/profile/check"),
          fetch("/api/trades/today"),
        ]);
        const profile = await profileRes.json();
        const trades = await tradesRes.json();

        if (profile.profile) {
          setData({
            dailyResult: trades.dailyResult || 0,
            dailyLossLimit: profile.profile.dailyLossLimit,
            tradesCount: trades.count || 0,
            maxEntries: profile.profile.maxEntries || 4,
          });
        }
      } catch { /* silent */ }
    }
    load();
  }, []);

  if (!data) return null;

  return (
    <CircuitBreaker
      dailyResult={data.dailyResult}
      dailyLossLimit={data.dailyLossLimit}
      tradesCount={data.tradesCount}
      maxEntries={data.maxEntries}
    />
  );
}
