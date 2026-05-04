"use client";

import { useEffect, useState } from "react";
import { CalendarDays, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EconomicEvent {
  id: string;
  date: string;
  time: string | null;
  title: string;
  country: string;
  impact: string;
}

const FLAG: Record<string, string> = { BR: "BR", US: "US", EU: "EU" };

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export function EconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [range, setRange] = useState<"today" | "week">("today");

  useEffect(() => {
    fetch(`/api/calendar?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch(() => {});
  }, [range]);

  const highImpact = events.filter((e) => e.impact === "HIGH");
  const hasHigh = highImpact.length > 0;

  if (events.length === 0 && range === "today") {
    return (
      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Calendario Hoje</span>
          </div>
          <button
            onClick={() => setRange("week")}
            className="text-[10px] text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
          >
            Ver semana
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Nenhum evento economico hoje. Dia limpo para operar.</p>
      </div>
    );
  }

  // Group by day for week view
  const grouped = new Map<string, EconomicEvent[]>();
  for (const e of events) {
    const d = new Date(e.date);
    const key = range === "week"
      ? `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
      : "Hoje";
    const list = grouped.get(key) || [];
    list.push(e);
    grouped.set(key, list);
  }

  const visibleEvents = expanded ? events : events.slice(0, 4);

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-colors",
      hasHigh
        ? "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50"
        : "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-100 dark:border-zinc-700/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className={cn("h-4 w-4", hasHigh ? "text-amber-500" : "text-blue-500")} />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Calendario {range === "today" ? "Hoje" : "Semana"}
          </span>
          {hasHigh && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded-full">
              <AlertTriangle className="h-2.5 w-2.5" />
              {highImpact.length} HIGH
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRange(range === "today" ? "week" : "today")}
            className="text-[10px] text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
          >
            {range === "today" ? "Semana" : "Hoje"}
          </button>
        </div>
      </div>

      {/* Events */}
      {range === "today" ? (
        <div className="space-y-1.5">
          {visibleEvents.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
          {events.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 pt-1 cursor-pointer"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Menos" : `+${events.length - 4} eventos`}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([day, evts]) => {
            const dayHasHigh = evts.some((e) => e.impact === "HIGH");
            return (
              <div key={day}>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider mb-1",
                  dayHasHigh ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"
                )}>
                  {day}
                </p>
                <div className="space-y-1">
                  {evts.map((e) => <EventRow key={e.id} event={e} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning */}
      {hasHigh && range === "today" && (
        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 italic">
          Eventos de alto impacto geram volatilidade extrema. Evite operar 15min antes e depois.
        </p>
      )}
    </div>
  );
}

function EventRow({ event: e }: { event: EconomicEvent }) {
  const timeStr = e.time ? `${e.time}` : "TBD";

  // Convert UTC time to BRT for display
  let brtTime = "";
  if (e.time) {
    const [h, m] = e.time.split(":").map(Number);
    const brtH = h - 3;
    brtTime = `${String(brtH < 0 ? brtH + 24 : brtH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <span className={cn(
        "w-1.5 h-1.5 rounded-full shrink-0",
        e.impact === "HIGH" ? "bg-rose-500" : e.impact === "MEDIUM" ? "bg-amber-400" : "bg-zinc-300"
      )} />
      <span className="text-[10px] font-mono text-zinc-400 w-10 shrink-0">
        {brtTime || "TBD"}
      </span>
      <span className={cn(
        "text-[10px] font-bold w-5 shrink-0",
        e.country === "BR" ? "text-emerald-600" : e.country === "US" ? "text-blue-500" : "text-violet-500"
      )}>
        {FLAG[e.country] || e.country}
      </span>
      <span className={cn(
        "text-xs truncate",
        e.impact === "HIGH"
          ? "font-semibold text-zinc-900 dark:text-zinc-100"
          : "text-zinc-600 dark:text-zinc-400"
      )}>
        {e.title}
      </span>
    </div>
  );
}
