import { NextRequest, NextResponse } from "next/server";
import { syncCalendarEvents } from "@/lib/economic-calendar";

// Cron semanal: popula eventos economicos para os proximos 2 meses
// vercel.json: { "path": "/api/cron/sync-calendar", "schedule": "0 8 * * 0" } (dom 5h BRT)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const count = await syncCalendarEvents(2);
    return NextResponse.json({ message: `${count} eventos adicionados ao calendario`, count });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json({ error: "Erro ao sincronizar calendario" }, { status: 500 });
  }
}
