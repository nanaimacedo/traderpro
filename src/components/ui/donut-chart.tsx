"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}

export function DonutChart({
  data,
  size = 140,
  thickness = 0.32,
  centerLabel,
  centerSub,
  className,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * (1 - thickness);
  const gapDeg = 2;

  let currentAngle = -90;
  const arcs = data.map((slice, i) => {
    const sliceDeg = (slice.value / total) * 360;
    const startAngle = currentAngle + gapDeg / 2;
    const endAngle = currentAngle + sliceDeg - gapDeg / 2;
    currentAngle += sliceDeg;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1Outer = cx + outerR * Math.cos(startRad);
    const y1Outer = cy + outerR * Math.sin(startRad);
    const x2Outer = cx + outerR * Math.cos(endRad);
    const y2Outer = cy + outerR * Math.sin(endRad);

    const x1Inner = cx + innerR * Math.cos(endRad);
    const y1Inner = cy + innerR * Math.sin(endRad);
    const x2Inner = cx + innerR * Math.cos(startRad);
    const y2Inner = cy + innerR * Math.sin(startRad);

    const largeArc = sliceDeg - gapDeg > 180 ? 1 : 0;

    const d = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
      "Z",
    ].join(" ");

    return { d, color: slice.color, index: i };
  });

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((arc) => (
            <path
              key={arc.index}
              d={arc.d}
              fill={arc.color}
              className="transition-all duration-200 cursor-pointer"
              style={{
                transform: hoveredIndex === arc.index ? "scale(1.06)" : "scale(1)",
                transformOrigin: `${cx}px ${cy}px`,
                filter: hoveredIndex === arc.index ? "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" : "none",
                opacity: hoveredIndex !== null && hoveredIndex !== arc.index ? 0.5 : 1,
              }}
              onMouseEnter={() => setHoveredIndex(arc.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        {/* Center label */}
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-zinc-900">{centerLabel}</span>
            {centerSub && (
              <span className="text-[10px] text-zinc-400 font-medium">{centerSub}</span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((slice, i) => (
          <button
            key={slice.label}
            className={cn(
              "flex items-center gap-2 text-left transition-opacity duration-200 cursor-pointer",
              hoveredIndex !== null && hoveredIndex !== i && "opacity-40"
            )}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-xs text-zinc-600">
              {slice.label}: <span className="font-semibold text-zinc-800">{slice.value}</span>
              <span className="text-zinc-400 ml-1">({((slice.value / total) * 100).toFixed(0)}%)</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
