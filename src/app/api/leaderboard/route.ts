import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  // Get all users for leaderboard
  const proUsers = await prisma.user.findMany({
    select: { id: true, name: true },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const leaderboard = await Promise.all(
    proUsers.map(async (u) => {
      const trades = await prisma.trade.findMany({
        where: {
          userId: u.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { result: true, financialResult: true, points: true },
      });

      if (trades.length === 0) return null;

      const gains = trades.filter(t => t.result === "GAIN").length;
      const total = trades.length;
      const winRate = (gains / total) * 100;
      const netResult = trades.reduce((s, t) => s + t.financialResult, 0);
      const totalPoints = trades.reduce((s, t) => s + t.points, 0);

      // Sharpe-like score
      const results = trades.map(t => t.financialResult);
      const mean = results.reduce((s, v) => s + v, 0) / results.length;
      const variance = results.reduce((s, v) => s + (v - mean) ** 2, 0) / results.length;
      const stdDev = Math.sqrt(variance);
      const sharpe = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;

      // Anonymize name: first name + initial
      const parts = u.name.split(" ");
      const displayName = parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1][0]}.`
        : parts[0];

      return {
        displayName,
        isYou: u.id === session.userId,
        trades: total,
        winRate: Math.round(winRate),
        netResult: Math.round(netResult * 100) / 100,
        totalPoints: Math.round(totalPoints * 10) / 10,
        sharpe: Math.round(sharpe * 100) / 100,
      };
    })
  );

  const ranked = leaderboard
    .filter(Boolean)
    .sort((a: any, b: any) => b.sharpe - a.sharpe)
    .map((entry: any, i: number) => ({ ...entry, rank: i + 1 }));

  return NextResponse.json({
    month: now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    leaderboard: ranked,
  });
}
