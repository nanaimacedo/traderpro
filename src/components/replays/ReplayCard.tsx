"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { deleteReplay } from "@/lib/actions";
import { Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Upload, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReplayImage {
  id: string;
  filename: string;
  originalName: string;
  path: string;
}

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
    images: ReplayImage[];
  };
  moodLabels: Record<string, { label: string; color: string }>;
}

export function ReplayCard({ replay, moodLabels }: ReplayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [images, setImages] = useState<ReplayImage[]>(replay.images);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const mood = replay.mood ? moodLabels[replay.mood] : null;
  const winRate = replay.entries > 0 ? (replay.gains / replay.entries) * 100 : 0;
  const isPositive = replay.points >= 0;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);

    const fd = new FormData();
    fd.append("replayId", replay.id);
    Array.from(e.target.files).forEach((file) => fd.append("file", file));

    const res = await fetch("/api/upload-replay", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      const uploaded: ReplayImage[] = Array.isArray(data) ? data : [data];
      setImages((prev) => [...prev, ...uploaded]);
    }

    setUploading(false);
    e.target.value = "";
  }

  return (
    <>
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
                  isPositive ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                )}>
                  {replay.points > 0 ? "+" : ""}{replay.points.toFixed(1)} pts
                </span>
                {images.length > 0 && (
                  <span className="text-xs text-zinc-400">{images.length} print{images.length > 1 ? "s" : ""}</span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{replay.title}</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button
                onClick={async () => {
                  if (deleting) return;
                  setDeleting(true);
                  await deleteReplay(replay.id);
                }}
                className="text-zinc-300 dark:text-zinc-600 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-400">Entradas:</span>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{replay.entries}</span>
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
              <span className={cn("text-xs font-semibold", winRate >= 50 ? "text-emerald-600" : "text-rose-500")}>
                {winRate.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-400">R$:</span>
              <span className={cn("text-xs font-semibold", isPositive ? "text-emerald-600" : "text-rose-500")}>
                {formatCurrency(replay.result)}
              </span>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {replay.content}
              </p>

              {/* Imagens */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative group rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 cursor-pointer"
                      onClick={() => setLightbox(img.path)}
                    >
                      <img src={img.path} alt={img.originalName} className="w-full h-36 object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                        <p className="text-[10px] text-white truncate">{img.originalName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload mais imagens */}
              <label className="cursor-pointer block">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="sr-only" />
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-violet-400 hover:text-violet-500 dark:hover:border-violet-600">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Enviando..." : "Adicionar prints"}
                </div>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setLightbox(null)}>
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="Print do replay"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
