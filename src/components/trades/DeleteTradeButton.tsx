"use client";

import { deleteTrade } from "@/lib/actions";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteTradeButton({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={async () => {
            await deleteTrade(id);
            if (redirectTo) router.push(redirectTo);
            else setConfirming(false);
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
