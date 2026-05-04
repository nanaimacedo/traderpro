import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "today";

  const now = new Date();
  let start: Date, end: Date;

  if (range === "week") {
    const day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 5);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  const events = await prisma.economicEvent.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: [{ date: "asc" }, { impact: "desc" }, { time: "asc" }],
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
