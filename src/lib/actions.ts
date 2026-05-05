"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");
  return session.userId;
}

import { ASSET_CONFIG } from "@/lib/asset-config";

const tradeSchema = z.object({
  date: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  direction: z.enum(["COMPRA", "VENDA"]),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  contracts: z.number().int().min(1).max(100),
  durationMinutes: z.number().int().positive().nullable(),
  setup: z.string().max(50).nullable(),
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
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  mood: z.enum(["OTIMISTA", "NEUTRO", "FRUSTRADO", "DISCIPLINADO", "ANSIOSO"]).nullable(),
  entries: z.number().int().min(0),
  gains: z.number().int().min(0),
  losses: z.number().int().min(0),
  points: z.number(),
});

const MAX_TRADES_PER_DAY = 4;

export async function createTrade(formData: FormData) {
  const userId = await requireUserId();

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
    setup: (formData.get("setup") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos: " + parsed.error.issues.map(i => i.message).join(", "));
  }

  const { date, time, direction, entryPrice, exitPrice, contracts, durationMinutes, setup, notes } = parsed.data;
  const tradeDate = new Date(date);
  const asset = (formData.get("asset") as string) || "WIN";
  const assetCfg = ASSET_CONFIG[asset] || ASSET_CONFIG.WIN;

  const profile = await prisma.traderProfile.findUnique({ where: { userId } });
  const maxEntries = profile?.maxEntries || MAX_TRADES_PER_DAY;

  const dayStart = new Date(tradeDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(tradeDate);
  dayEnd.setHours(23, 59, 59, 999);

  const todayCount = await prisma.trade.count({
    where: { userId, date: { gte: dayStart, lte: dayEnd } },
  });

  if (todayCount >= maxEntries) {
    throw new Error(`Limite de ${maxEntries} operações por dia atingido`);
  }

  const points = direction === "COMPRA"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  const pointValue = assetCfg.pointValue;
  const financialResult = points * pointValue * contracts;
  const result = points > 0 ? "GAIN" : points < 0 ? "LOSS" : "ZERO";

  // Circuit breaker: check daily loss limit
  if (profile?.dailyLossLimit) {
    const todayTrades = await prisma.trade.findMany({
      where: { userId, date: { gte: dayStart, lte: dayEnd } },
      select: { financialResult: true },
    });
    const todayResult = todayTrades.reduce((s, t) => s + t.financialResult, 0);
    if (todayResult + financialResult < -profile.dailyLossLimit) {
      throw new Error(`Circuit breaker: loss diário atingiria R$ ${Math.abs(todayResult + financialResult).toFixed(2)}, limite é R$ ${profile.dailyLossLimit.toFixed(2)}`);
    }
  }

  await prisma.trade.create({
    data: {
      userId,
      date: tradeDate,
      time,
      asset,
      direction,
      entryPrice,
      exitPrice,
      contracts,
      result,
      points,
      financialResult,
      pointValue,
      setup,
      durationMinutes,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/trades");
}

export async function createTradeWithDiary(formData: FormData) {
  const userId = await requireUserId();

  const parsed = tradeSchema.safeParse({
    date: formData.get("date"),
    time: formData.get("time"),
    direction: formData.get("direction"),
    entryPrice: parseFloat(formData.get("entryPrice") as string),
    exitPrice: parseFloat(formData.get("exitPrice") as string),
    contracts: parseInt(formData.get("contracts") as string),
    durationMinutes: formData.get("durationMinutes") ? parseInt(formData.get("durationMinutes") as string) : null,
    setup: (formData.get("setup") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos: " + parsed.error.issues.map(i => i.message).join(", "));
  }

  const { date, time, direction, entryPrice, exitPrice, contracts, durationMinutes, setup, notes } = parsed.data;
  const tradeDate = new Date(date);
  const asset = (formData.get("asset") as string) || "WIN";
  const assetCfg = ASSET_CONFIG[asset] || ASSET_CONFIG.WIN;

  const profile = await prisma.traderProfile.findUnique({ where: { userId } });
  const maxEntries = profile?.maxEntries || MAX_TRADES_PER_DAY;

  const dayStart = new Date(tradeDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(tradeDate); dayEnd.setHours(23, 59, 59, 999);

  const todayCount = await prisma.trade.count({ where: { userId, date: { gte: dayStart, lte: dayEnd } } });
  if (todayCount >= maxEntries) throw new Error(`Limite de ${maxEntries} operações por dia atingido`);

  const points = direction === "COMPRA" ? exitPrice - entryPrice : entryPrice - exitPrice;
  const pointValue = assetCfg.pointValue;
  const financialResultOverrideRaw = (formData.get("financialResultOverride") as string)?.trim();
  const financialResultOverride = financialResultOverrideRaw ? parseFloat(financialResultOverrideRaw) : null;
  const financialResult = (financialResultOverride != null && !isNaN(financialResultOverride))
    ? financialResultOverride
    : points * pointValue * contracts;
  const result = financialResult > 0 ? "GAIN" : financialResult < 0 ? "LOSS" : "ZERO";

  if (profile?.dailyLossLimit) {
    const todayTrades = await prisma.trade.findMany({ where: { userId, date: { gte: dayStart, lte: dayEnd } }, select: { financialResult: true } });
    const todayResult = todayTrades.reduce((s, t) => s + t.financialResult, 0);
    if (todayResult + financialResult < -profile.dailyLossLimit) {
      throw new Error(`Circuit breaker: loss diário atingiria R$ ${Math.abs(todayResult + financialResult).toFixed(2)}, limite é R$ ${profile.dailyLossLimit.toFixed(2)}`);
    }
  }

  const emotionsRaw = (formData.get("emotions") as string) || null;
  let emotions: string | null = null;
  if (emotionsRaw) {
    try {
      const parsed = JSON.parse(emotionsRaw);
      if (Array.isArray(parsed) && parsed.length > 0) emotions = emotionsRaw;
    } catch {}
  }
  const whatWentRight = (formData.get("whatWentRight") as string)?.trim() || null;
  const whereToImprove = (formData.get("whereToImprove") as string)?.trim() || null;
  const screenshotUrl = (formData.get("screenshotUrl") as string)?.trim() || null;

  await prisma.trade.create({
    data: { userId, date: tradeDate, time, asset, direction, entryPrice, exitPrice, contracts, result, points, financialResult, pointValue, setup, durationMinutes, notes, emotions, whatWentRight, whereToImprove, screenshotUrl },
  });

  revalidatePath("/");
  revalidatePath("/trades");
}

export async function deleteTrade(id: string) {
  const userId = await requireUserId();
  await prisma.trade.deleteMany({ where: { id, userId } });
  revalidatePath("/");
  revalidatePath("/trades");
}

export async function getTrades(month?: number, year?: number) {
  const userId = await requireUserId();
  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();

  const startDate = new Date(y, m, 1);
  const endDate = new Date(y, m + 1, 0, 23, 59, 59);

  return prisma.trade.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });
}

export async function getAllTrades(page = 1, limit = 50) {
  const userId = await requireUserId();
  const skip = (page - 1) * limit;

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      skip,
      take: limit,
    }),
    prisma.trade.count({ where: { userId } }),
  ]);

  return { trades, total, pages: Math.ceil(total / limit) };
}

export async function getTradeById(id: string) {
  const userId = await requireUserId();
  return prisma.trade.findFirst({ where: { id, userId } });
}

export async function createDiaryEntry(formData: FormData) {
  const userId = await requireUserId();

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
      userId,
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
  const userId = await requireUserId();
  return prisma.diaryEntry.findMany({
    where: { userId },
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
  const userId = await requireUserId();
  await prisma.diaryEntry.deleteMany({ where: { id, userId } });
  revalidatePath("/diary");
}

export async function createBrokerReport(formData: FormData) {
  const userId = await requireUserId();
  const date = new Date(formData.get("date") as string);
  const filename = formData.get("filename") as string;
  const originalName = formData.get("originalName") as string;

  const int = (key: string) => formData.get(key) ? parseInt(formData.get(key) as string) : null;
  const float = (key: string) => formData.get(key) ? parseFloat(formData.get(key) as string) : null;

  await prisma.brokerReport.create({
    data: {
      userId, date, filename, originalName,
      totalTrades:        int("totalTrades"),
      totalGain:          float("totalGain"),
      totalLoss:          float("totalLoss"),
      netResult:          float("netResult"),
      fees:               float("fees"),
      gains:              int("gains"),
      losses:             int("losses"),
      zeros:              int("zeros"),
      tradingDays:        int("tradingDays"),
      maxDailyGain:       float("maxDailyGain"),
      maxDailyLoss:       float("maxDailyLoss"),
      maxGainPerOp:       float("maxGainPerOp"),
      maxLossPerOp:       float("maxLossPerOp"),
      maxDurationMinutes: int("maxDurationMinutes"),
      maxDurationResult:  float("maxDurationResult"),
      minDurationMinutes: int("minDurationMinutes"),
      minDurationResult:  float("minDurationResult"),
    },
  });

  revalidatePath("/reports");
}

export async function getBrokerReports() {
  const userId = await requireUserId();
  return prisma.brokerReport.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

export async function getBrokerReportForMonth(month: number, year: number) {
  const userId = await requireUserId();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0); // last day of month
  return prisma.brokerReport.findFirst({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
  });
}

export async function deleteBrokerReport(id: string) {
  const userId = await requireUserId();
  await prisma.brokerReport.deleteMany({ where: { id, userId } });
  revalidatePath("/reports");
}

// === REPLAYS ===

export async function createReplay(formData: FormData) {
  const userId = await requireUserId();

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
  const financialResult = formData.get("financialResult");
  const result = financialResult ? parseFloat(financialResult as string) : points * 0.2;

  const replay = await prisma.replay.create({
    data: { userId, date: new Date(date), title, content, mood, entries, gains, losses, zeros, points, result },
  });

  revalidatePath("/replays");
  return { id: replay.id };
}

export async function getReplays() {
  const userId = await requireUserId();
  return prisma.replay.findMany({
    where: { userId },
    include: { images: { orderBy: { createdAt: "asc" } } },
    orderBy: { date: "desc" },
  });
}

export async function deleteReplay(id: string) {
  const userId = await requireUserId();
  await prisma.replay.deleteMany({ where: { id, userId } });
  revalidatePath("/replays");
}

// === EXPORT CSV ===

export async function exportTradesCSV() {
  const userId = await requireUserId();
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const header = "Data,Hora,Ativo,Direção,Entrada,Saída,Contratos,Resultado,Pontos,Financeiro,Setup,Notas";
  const rows = trades.map(t => {
    const date = new Date(t.date).toLocaleDateString("pt-BR");
    return `${date},${t.time},${t.asset},${t.direction},${t.entryPrice},${t.exitPrice},${t.contracts},${t.result},${t.points},${t.financialResult},${t.setup || ""},${(t.notes || "").replace(/,/g, ";")}`;
  });

  return [header, ...rows].join("\n");
}
