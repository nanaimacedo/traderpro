"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950 mb-4">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Algo deu errado
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
        {error.message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <Button onClick={reset} variant="outline">
        Tentar novamente
      </Button>
    </div>
  );
}
