import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            trend === "up" && "text-emerald-600",
            trend === "down" && "text-rose-500",
            !trend && "text-zinc-900"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-400">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          trend === "up" && "bg-emerald-50",
          trend === "down" && "bg-rose-50",
          !trend && "bg-zinc-50"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            trend === "up" && "text-emerald-600",
            trend === "down" && "text-rose-500",
            !trend && "text-zinc-400"
          )} />
        </div>
      </div>
    </Card>
  );
}
