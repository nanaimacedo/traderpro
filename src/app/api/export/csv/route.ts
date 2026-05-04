import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: session.userId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const header = "Data,Hora,Ativo,Direcao,Entrada,Saida,Contratos,Resultado,Pontos,Financeiro,Setup,Duracao(min),Notas";
  const rows = trades.map(t => {
    const date = new Date(t.date).toLocaleDateString("pt-BR");
    const notes = (t.notes || "").replace(/,/g, ";").replace(/\n/g, " ");
    return `${date},${t.time},${t.asset},${t.direction},${t.entryPrice},${t.exitPrice},${t.contracts},${t.result},${t.points},${t.financialResult},${t.setup || ""},${t.durationMinutes || ""},${notes}`;
  });

  const csv = [header, ...rows].join("\n");
  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="traderpro-trades-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
