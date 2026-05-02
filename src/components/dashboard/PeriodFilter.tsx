"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import Link from "next/link";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function PeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth()));
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));

  function navigate(m: number, y: number) {
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    router.push(`/?month=${m}&year=${y}`);
  }

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => navigate(month - 1, year)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-1.5 min-w-[180px] justify-center">
        <span className="text-sm font-semibold text-zinc-900">
          {monthNames[month]} {year}
        </span>
      </div>

      <button
        onClick={() => navigate(month + 1, year)}
        disabled={isCurrentMonth}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={() => navigate(now.getMonth(), now.getFullYear())}
          className="text-xs text-zinc-500 hover:text-zinc-700 underline cursor-pointer ml-1"
        >
          Hoje
        </button>
      )}

      <Link
        href={`/reports/pdf?month=${month}&year=${year}`}
        className="ml-auto flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
      >
        <FileDown className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Gerar Relatório</span>
        <span className="sm:hidden">PDF</span>
      </Link>
    </div>
  );
}
