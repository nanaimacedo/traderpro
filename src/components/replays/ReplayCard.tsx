"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { deleteReplay } from "@/lib/actions";
import { Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReplayCardProps {
  replay: {
    id: string;
    date: Date;
    title: string;
    content: string;
    mood: string | null;
    entries: number;
    gains: number;
    losses: number;
    zeros: number;
    points: number;
    result: number;
  };
  moodLabels: Record<string, { label: string; color: string }>;
}

export function ReplayCard({ replay, moodLabels }: ReplayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const mood = replay.mood ? moodLabels[replay.mood] : null;
  const winRate = replay.entries > 0 ? (replay.gains / replay.entries) * 100 : 0;
  const isPositive = replay.points >= 0;

  return (
    <Card className="overflow-hidden">
      <div className={cn("h-0.5", isPositive ? "bg-emerald-500" : "bg-rose-500")} />
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-zinc-400">{formatDate(replay.date)}</span>
              {mood && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${mood.color}`}>
                  {mood.label}
                </span>
              )}
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              )}>
                {replay.points > 0 ? "+" : ""}{replay.points.toFixed(1)} pts
              </span>
            </div>
            <h4 className="text-sm font-semibold text-zinc-900">{replay.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={async () => {
                if (deleting) return;
                setDeleting(true);
                await deleteReplay(replay.id);
              }}
              className="text-zinc-300 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400">Entradas:</span>
            <span className="text-xs font-semibold text-zinc-700">{replay.entries}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">{replay.gains}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-rose-500" />
            <span className="text-xs font-semibold text-rose-500">{replay.losses}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400">WR:</span>
            <span className={cn(
              "text-xs font-semibold",
              winRate >= 50 ? "text-emerald-600" : "text-rose-500"
            )}>
              {winRate.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400">R$:</span>
            <span className={cn(
              "text-xs font-semibold",
              isPositive ? "text-emerald-600" : "text-rose-500"
            )}>
              {formatCurrency(replay.result)}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
              {replay.content}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
