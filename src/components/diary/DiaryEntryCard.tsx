"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { deleteDiaryEntry } from "@/lib/actions";
import { Trash2, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface DiaryEntryProps {
  entry: {
    id: string;
    date: Date;
    title: string;
    content: string;
    mood: string | null;
    images: { id: string; path: string; originalName: string }[];
    trades: { id: string; result: string }[];
  };
  moodLabels: Record<string, { label: string; color: string }>;
}

export function DiaryEntryCard({ entry, moodLabels }: DiaryEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const mood = entry.mood ? moodLabels[entry.mood] : null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-zinc-400">{formatDate(entry.date)}</span>
              {mood && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${mood.color}`}>
                  {mood.label}
                </span>
              )}
              {entry.images.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <ImageIcon className="h-3 w-3" />
                  {entry.images.length}
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-zinc-900">{entry.title}</h4>
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
                await deleteDiaryEntry(entry.id);
              }}
              className="text-zinc-300 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </p>

            {entry.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {entry.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative rounded-lg overflow-hidden border border-zinc-100 hover:border-zinc-300 transition-colors"
                  >
                    <img
                      src={img.path}
                      alt={img.originalName}
                      className="w-full h-40 object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
