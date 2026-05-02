"use client";

import { GaugeChart } from "@/components/ui/gauge-chart";

interface WinRateGaugeProps {
  winRate: number;
  gains: number;
  losses: number;
  zeros: number;
}

export function WinRateGauge({ winRate, gains, losses, zeros }: WinRateGaugeProps) {
  const total = gains + losses + zeros;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="text-3xl font-bold text-zinc-300">—</div>
        <p className="text-xs text-zinc-400 mt-1">Sem operacoes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <GaugeChart
        value={winRate}
        sublabel="Win Rate"
        size={150}
      />
      <div className="flex items-center gap-4 mt-3">
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-600">{gains}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Gains</p>
        </div>
        <div className="h-6 w-px bg-zinc-200" />
        <div className="text-center">
          <p className="text-lg font-bold text-rose-500">{losses}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Losses</p>
        </div>
        {zeros > 0 && (
          <>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="text-center">
              <p className="text-lg font-bold text-zinc-400">{zeros}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Zeros</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
