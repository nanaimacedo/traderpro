"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CircuitBreakerProps {
  dailyResult: number;
  dailyLossLimit: number | null;
  tradesCount: number;
  maxEntries: number;
}

export function CircuitBreaker({ dailyResult, dailyLossLimit, tradesCount, maxEntries }: CircuitBreakerProps) {
  const [dismissed, setDismissed] = useState(false);

  const lossTriggered = dailyLossLimit != null && dailyLossLimit > 0 && dailyResult <= -dailyLossLimit;
  const limitTriggered = tradesCount >= maxEntries;
  const isTriggered = lossTriggered || limitTriggered;

  if (!isTriggered || dismissed) return null;

  const message = lossTriggered
    ? `Loss diário de R$ ${Math.abs(dailyResult).toFixed(2)} atingiu o limite de R$ ${dailyLossLimit!.toFixed(2)}. TRAVA A PLATAFORMA.`
    : `${tradesCount} entradas hoje — limite de ${maxEntries} atingido. Hora de parar.`;

  const subMessage = lossTriggered
    ? "O melhor trade do dia é o trade que você NÃO faz. Proteja seu capital financeiro E psicológico."
    : "Disciplina é fazer o certo mesmo quando a vontade pede mais uma entrada.";

  return (
    <div className={cn(
      "rounded-xl border-2 p-4 animate-in fade-in slide-in-from-top-2 duration-500",
      lossTriggered
        ? "bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800"
        : "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          lossTriggered ? "bg-rose-100 dark:bg-rose-900" : "bg-amber-100 dark:bg-amber-900"
        )}>
          {lossTriggered ? (
            <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "text-sm font-bold",
            lossTriggered ? "text-rose-800 dark:text-rose-300" : "text-amber-800 dark:text-amber-300"
          )}>
            {lossTriggered ? "CIRCUIT BREAKER ATIVADO" : "LIMITE DE ENTRADAS"}
          </h3>
          <p className={cn(
            "text-xs mt-1",
            lossTriggered ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"
          )}>
            {message}
          </p>
          <p className={cn(
            "text-[10px] mt-2 italic",
            lossTriggered ? "text-rose-600/80 dark:text-rose-500/80" : "text-amber-600/80 dark:text-amber-500/80"
          )}>
            {subMessage}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 cursor-pointer"
        >
          <X className="h-4 w-4 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
