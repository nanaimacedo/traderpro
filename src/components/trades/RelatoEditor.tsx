"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function RelatoEditor({ value, onChange, name, placeholder, rows = 5, className }: Props) {
  const [uploading, setUploading] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const images = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    e.preventDefault();

    const cursor = ref.current?.selectionStart ?? value.length;

    for (const file of images) {
      setUploading((u) => u + 1);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload-trade-screenshot", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          const insert = `\n![gráfico](${data.url})\n`;
          onChange(value.slice(0, cursor) + insert + value.slice(cursor));
        }
      } catch { /* silently fail */ }
      setUploading((u) => u - 1);
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500",
          className
        )}
      />
      {uploading > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs text-violet-500 bg-white dark:bg-zinc-900 px-2 py-1 rounded-md border border-violet-100 dark:border-violet-900">
          <Loader2 className="h-3 w-3 animate-spin" />
          Enviando {uploading > 1 ? `${uploading} imagens` : "imagem"}...
        </div>
      )}
    </div>
  );
}
