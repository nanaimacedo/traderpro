"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTrade(formData: FormData) {
  const date = new Date(formData.get("date") as string);
  const time = formData.get("time") as string;
  const direction = formData.get("direction") as string;
  const entryPrice = parseFloat(formData.get("entryPrice") as string);
  const exitPrice = parseFloat(formData.get("exitPrice") as string);
  const contracts = parseInt(formData.get("contracts") as string);
  const durationMinutes = formData.get("durationMinutes")
    ? parseInt(formData.get("durationMinutes") as string)
    : null;
  const notes = (formData.get("notes") as string) || null;

  const points = direction === "COMPRA"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  const financialResult = points * 0.2 * contracts;

  const result = points > 0 ? "GAIN" : points < 0 ? "LOSS" : "ZERO";

  await prisma.trade.create({
    data: {
      date,
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

export async function getAllTrades() {
  return prisma.trade.findMany({
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
}

export async function createDiaryEntry(formData: FormData) {
  const date = new Date(formData.get("date") as string);
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const mood = (formData.get("mood") as string) || null;

  const entry = await prisma.diaryEntry.create({
    data: { date, title, content, mood },
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
