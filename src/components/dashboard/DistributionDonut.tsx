"use client";

import { DonutChart } from "@/components/ui/donut-chart";

interface DistributionDonutProps {
  gains: number;
  losses: number;
  zeros: number;
}

export function DistributionDonut({ gains, losses, zeros }: DistributionDonutProps) {
  const total = gains + losses + zeros;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="text-sm text-zinc-400">Sem dados</div>
      </div>
    );
  }

  const data = [
    { label: "Gain", value: gains, color: "#059669" },
    { label: "Loss", value: losses, color: "#f43f5e" },
    ...(zeros > 0 ? [{ label: "Zero", value: zeros, color: "#a1a1aa" }] : []),
  ];

  return (
    <DonutChart
      data={data}
      size={120}
      thickness={0.35}
      centerLabel={`${total}`}
      centerSub="TRADES"
    />
  );
}
