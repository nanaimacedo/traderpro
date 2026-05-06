"use client";

import { useState } from "react";
import { updateTradeFinancialResult } from "@/lib/actions";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function EditFinancialResult({ tradeId, current }: { tradeId: string; current: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current));
  const [loading, setLoading] = useState(false);

  async function save() {
    const num = parseFloat(value.replace(",", "."));
    if (isNaN(num)) return;
    setLoading(true);
    await updateTradeFinancialResult(tradeId, num);
    setLoading(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setValue(String(current)); setEditing(true); }}
        className="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        title="Editar resultado"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className="h-7 w-28 text-sm tabular-nums"
        autoFocus
      />
      <button onClick={save} disabled={loading} className="text-emerald-500 hover:text-emerald-600">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
      <button onClick={() => setEditing(false)} className="text-zinc-400 hover:text-zinc-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
