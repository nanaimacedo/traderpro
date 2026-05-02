"use client";

import { deleteBrokerReport } from "@/lib/actions";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteReportButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={async () => {
            await deleteBrokerReport(id);
            setConfirming(false);
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
        >
          Sim
        </button>
        <span className="text-xs text-zinc-300">/</span>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-zinc-500 hover:text-zinc-700 cursor-pointer"
        >
          Nao
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-zinc-300 hover:text-rose-500 transition-colors cursor-pointer"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
