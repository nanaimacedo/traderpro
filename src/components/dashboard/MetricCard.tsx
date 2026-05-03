import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  accentColor?: string;
  className?: string;
}

const trendConfig = {
  up: {
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-600",
    glow: "from-emerald-500/5",
  },
  down: {
    accent: "bg-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-950",
    iconColor: "text-rose-500",
    valueColor: "text-rose-500",
    glow: "from-rose-500/5",
  },
  neutral: {
    accent: "bg-zinc-400",
    iconBg: "bg-zinc-50 dark:bg-zinc-800",
    iconColor: "text-zinc-400",
    valueColor: "text-zinc-900 dark:text-zinc-100",
    glow: "from-zinc-500/5",
  },
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, className }: MetricCardProps) {
  const config = trendConfig[trend || "neutral"];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]",
        className
      )}
    >
      {/* Top accent line */}
      <div className={cn(
        "absolute top-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-500",
        config.accent
      )} />

      {/* Glow overlay */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b to-transparent pointer-events-none",
        config.glow
      )} />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className={cn("text-2xl font-bold tracking-tight", config.valueColor)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
          config.iconBg
        )}>
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>
      </div>
    </div>
  );
}
