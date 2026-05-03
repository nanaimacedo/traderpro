"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const tradeSchema = z.object({
  date: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  direction: z.enum(["COMPRA", "VENDA"]),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  contracts: z.number().int().min(1).max(100),
  durationMinutes: z.number().int().positive().nullable(),
  notes: z.string().max(1000).nullable(),
});

const diarySchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  mood: z.enum(["OTIMISTA", "NEUTRO", "FRUSTRADO", "DISCIPLINADO", "ANSIOSO"]).nullable(),
});

const replaySchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  mood: z.enum(["OTIMISTA", "NEUTRO", "FRUSTRADO", "DISCIPLINADO", "ANSIOSO"]).nullable(),
  entries: z.number().int().min(0),
  gains: z.number().int().min(0),
  losses: z.number().int().min(0),
  points: z.number(),
});

const MAX_TRADES_PER_DAY = 4;

export async function createTrade(formData: FormData) {
  const parsed = tradeSchema.safeParse({
    date: formData.get("date"),
    time: formData.get("time"),
    direction: formData.get("direction"),
    entryPrice: parseFloat(formData.get("entryPrice") as string),
    exitPrice: parseFloat(formData.get("exitPrice") as string),
    contracts: parseInt(formData.get("contracts") as string),
    durationMinutes: formData.get("durationMinutes")
      ? parseInt(formData.get("durationMinutes") as string)
      : null,
    notes: (formData.get("notes") as string) || null,
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos: " + parsed.error.issues.map(i => i.message).join(", "));
  }

  const { date, time, direction, entryPrice, exitPrice, contracts, durationMinutes, notes } = parsed.data;
  const tradeDate = new Date(date);

  // Enforce 4 trades/day limit
  const dayStart = new Date(tradeDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(tradeDate);
  dayEnd.setHours(23, 59, 59, 999);

  const todayCount = await prisma.trade.count({
    where: { date: { gte: dayStart, lte: dayEnd } },
  });

  if (todayCount >= MAX_TRADES_PER_DAY) {
    throw new Error(`Limite de ${MAX_TRADES_PER_DAY} operações por dia atingido`);
  }

  const points = direction === "COMPRA"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  const financialResult = points * 0.2 * contracts;
  const result = points > 0 ? "GAIN" : points < 0 ? "LOSS" : "ZERO";

  await prisma.trade.create({
    data: {
      date: tradeDate,
      time,
      asset: "WIN",
      direction,
      entryPrice,
      exitPrice,
      contracts,
      result,
      points,
      financialResult,
      durationMinutes,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/trades");
}

export async function deleteTrade(id: string) {
  await prisma.trade.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/trades");
}

export async function getTrades(month?: number, year?: number) {
  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();

  const startDate = new Date(y, m, 1);
  const endDate = new Date(y, m + 1, 0, 23, 59, 59);

  return prisma.trade.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });
}

export async function getAllTrades(page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      orderBy: [{ date: "desc" }, { time: "desc" }],
      skip,
      take: limit,
    }),
    prisma.trade.count(),
  ]);

  return { trades, total, pages: Math.ceil(total / limit) };
}

export async function createDiaryEntry(formData: FormData) {
  const parsed = diarySchema.safeParse({
    date: formData.get("date"),
    title: formData.get("title"),
    content: formData.get("content"),
    mood: (formData.get("mood") as string) || null,
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  const entry = await prisma.diaryEntry.create({
    data: {
      date: new Date(parsed.data.date),
      title: parsed.data.title,
      content: parsed.data.content,
      mood: parsed.data.mood,
    },
  });

  revalidatePath("/diary");
  return entry;
}

export async function getDiaryEntries() {
  return prisma.diaryEntry.findMany({
    include: { images: true, trades: true },
    orderBy: { date: "desc" },
  });
}

export async function getDiaryEntry(id: string) {
  return prisma.diaryEntry.findUnique({
    where: { id },
    include: { images: true, trades: true },
  });
}

export async function deleteDiaryEntry(id: string) {
  await prisma.diaryEntry.delete({ where: { id } });
  revalidatePath("/diary");
}

export async function createBrokerReport(formData: FormData) {
  const date = new Date(formData.get("date") as string);
  const filename = formData.get("filename") as string;
  const originalName = formData.get("originalName") as string;
  const totalTrades = formData.get("totalTrades") ? parseInt(formData.get("totalTrades") as string) : null;
  const totalGain = formData.get("totalGain") ? parseFloat(formData.get("totalGain") as string) : null;
  const totalLoss = formData.get("totalLoss") ? parseFloat(formData.get("totalLoss") as string) : null;
  const netResult = formData.get("netResult") ? parseFloat(formData.get("netResult") as string) : null;
  const fees = formData.get("fees") ? parseFloat(formData.get("fees") as string) : null;

  await prisma.brokerReport.create({
    data: { date, filename, originalName, totalTrades, totalGain, totalLoss, netResult, fees },
  });

  revalidatePath("/reports");
}

export async function getBrokerReports() {
  return prisma.brokerReport.findMany({
    orderBy: { date: "desc" },
  });
}

export async function deleteBrokerReport(id: string) {
  await prisma.brokerReport.delete({ where: { id } });
  revalidatePath("/reports");
}

// === REPLAYS ===

export async function createReplay(formData: FormData) {
  const parsed = replaySchema.safeParse({
    date: formData.get("date"),
    title: formData.get("title"),
    content: formData.get("content"),
    mood: (formData.get("mood") as string) || null,
    entries: parseInt(formData.get("entries") as string) || 0,
    gains: parseInt(formData.get("gains") as string) || 0,
    losses: parseInt(formData.get("losses") as string) || 0,
    points: parseFloat(formData.get("points") as string) || 0,
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  const { date, title, content, mood, entries, gains, losses, points } = parsed.data;
  const zeros = entries - gains - losses;
  const result = points * 0.2;

  await prisma.replay.create({
    data: { date: new Date(date), title, content, mood, entries, gains, losses, zeros, points, result },
  });

  revalidatePath("/replays");
}

export async function getReplays() {
  return prisma.replay.findMany({
    orderBy: { date: "desc" },
  });
}

export async function deleteReplay(id: string) {
  await prisma.replay.delete({ where: { id } });
  revalidatePath("/replays");
}
