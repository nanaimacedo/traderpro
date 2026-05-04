import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ImportTrade {
  date: string;
  time: string;
  direction: "COMPRA" | "VENDA";
  entryPrice: number;
  exitPrice: number;
  contracts: number;
  asset: string;
  source: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { trades, source } = (await request.json()) as { trades: ImportTrade[]; source: string };

    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: "Nenhum trade para importar" }, { status: 400 });
    }

    if (trades.length > 500) {
      return NextResponse.json({ error: "Máximo 500 trades por importação" }, { status: 400 });
    }

    // Load profile for point value
    const profile = await prisma.traderProfile.findUnique({
      where: { userId: session.userId },
    });
    const pointValue = profile?.pointValue || 0.2;

    const created = await prisma.trade.createMany({
      data: trades.map((t) => {
        const points = t.direction === "COMPRA"
          ? t.exitPrice - t.entryPrice
          : t.entryPrice - t.exitPrice;
        const financialResult = points * pointValue * t.contracts;
        const result = points > 0 ? "GAIN" : points < 0 ? "LOSS" : "ZERO";

        return {
          userId: session.userId,
          date: new Date(t.date),
          time: t.time,
          asset: t.asset || "WIN",
          direction: t.direction,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          contracts: t.contracts,
          result,
          points,
          financialResult,
          pointValue,
          source: source || "csv-import",
        };
      }),
    });

    revalidatePath("/");
    revalidatePath("/trades");

    return NextResponse.json({ imported: created.count });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Erro ao importar trades" }, { status: 500 });
  }
}
