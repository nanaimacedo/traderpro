"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GaugeChartProps {
  value: number; // 0-100
  label?: string;
  sublabel?: string;
  size?: number;
  className?: string;
}

function getColor(value: number) {
  if (value >= 60) return { stroke: "#059669", bg: "text-emerald-600", glow: "rgba(5,150,105,0.15)" };
  if (value >= 40) return { stroke: "#f59e0b", bg: "text-amber-500", glow: "rgba(245,158,11,0.15)" };
  return { stroke: "#f43f5e", bg: "text-rose-500", glow: "rgba(244,63,94,0.15)" };
}

export function GaugeChart({ value, label, sublabel, size = 160, className }: GaugeChartProps) {
  const [animated, setAnimated] = useState(0);
  const color = getColor(value);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animated / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-zinc-100 dark:stroke-zinc-800"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 6px ${color.glow})`,
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", color.bg)}>
            {animated.toFixed(1)}%
          </span>
          {sublabel && (
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</p>
      )}
    </div>
  );
}
