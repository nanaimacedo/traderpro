import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// TradingView public economic calendar — same data source as investing.com
async function fetchLiveEvents(from: Date, to: Date) {
  const url = `https://economic-calendar.tradingview.com/events?from=${from.toISOString()}&to=${to.toISOString()}&countries=US,BR`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Origin": "https://br.investing.com",
      "Referer": "https://br.investing.com/",
    },
    next: { revalidate: 1800 }, // cache 30min
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data : (data.result ?? null);
}

function mapImpact(importance: number): string {
  if (importance >= 3) return "HIGH";
  if (importance === 2) return "MEDIUM";
  return "LOW";
}

async function syncLiveEvents(from: Date, to: Date) {
  const raw = await fetchLiveEvents(from, to);
  if (!raw?.length) return false;

  // Filter BR and US only, importance >= 1
  const filtered = raw.filter((e: any) =>
    ["US", "BR"].includes(e.country?.toUpperCase?.() ?? "") && (e.importance ?? 0) >= 1
  );

  for (const e of filtered) {
    const eventDate = new Date(e.date);
    const timeStr = eventDate.toISOString().slice(11, 16); // HH:mm UTC
    const country = e.country?.toUpperCase() ?? "US";
    const title = e.title ?? e.indicator ?? "Evento";
    const impact = mapImpact(e.importance ?? 1);

    await prisma.economicEvent.upsert({
      where: {
        // unique by date + title since there's no external id in schema
        // use findFirst + create pattern instead
        id: `tv_${e.id ?? `${eventDate.toISOString().split("T")[0]}_${title}`.replace(/\W/g, "_").slice(0, 48)}`,
      },
      update: {
        time: timeStr,
        impact,
        forecast: e.forecast != null ? String(e.forecast) : null,
        previous: e.previous != null ? String(e.previous) : null,
      },
      create: {
        id: `tv_${e.id ?? `${eventDate.toISOString().split("T")[0]}_${title}`.replace(/\W/g, "_").slice(0, 48)}`,
        date: new Date(eventDate.toISOString().split("T")[0]), // midnight UTC
        time: timeStr,
        title,
        country,
        impact,
        forecast: e.forecast != null ? String(e.forecast) : null,
        previous: e.previous != null ? String(e.previous) : null,
      },
    });
  }
  return true;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "today";

  // BRT = UTC-3
  const nowUtc = new Date();
  const BRT = -3 * 60 * 60 * 1000;
  const nowBrt = new Date(nowUtc.getTime() + BRT);

  let start: Date, end: Date;

  if (range === "week") {
    const day = nowBrt.getUTCDay();
    start = new Date(nowBrt);
    start.setUTCDate(nowBrt.getUTCDate() - (day === 0 ? 6 : day - 1));
    start.setUTCHours(0, 0, 0, 0);
    end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 5);
    end.setUTCHours(23, 59, 59, 999);
    // Convert back to UTC for DB query
    start = new Date(start.getTime() - BRT);
    end = new Date(end.getTime() - BRT);
  } else {
    const y = nowBrt.getUTCFullYear(), m = nowBrt.getUTCMonth(), d = nowBrt.getUTCDate();
    start = new Date(Date.UTC(y, m, d, 0, 0, 0) - BRT);
    end = new Date(Date.UTC(y, m, d, 23, 59, 59) - BRT);
  }

  // Try to sync live data (fire and check)
  try {
    await syncLiveEvents(start, end);
  } catch {
    // silently fall back to DB
  }

  const events = await prisma.economicEvent.findMany({
    where: {
      date: { gte: start, lte: end },
      country: { in: ["BR", "US"] },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const body = await request.json();
  const { date, time, title, country, impact, forecast, previous } = body;

  if (!date || !title || !country || !impact) {
    return NextResponse.json({ error: "Campos obrigatorios: date, title, country, impact" }, { status: 400 });
  }

  const event = await prisma.economicEvent.create({
    data: {
      date: new Date(date),
      time: time || null,
      title,
      country,
      impact,
      forecast: forecast || null,
      previous: previous || null,
    },
  });

  return NextResponse.json(event);
}
