import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const SYMBOL_MAP: Record<string, string> = {
  WIN: "%5EBVSP",
  WDO: "USDBRL=X",
  PETR4: "PETR4.SA",
  VALE3: "VALE3.SA",
  ITUB4: "ITUB4.SA",
  BBDC4: "BBDC4.SA",
  BBAS3: "BBAS3.SA",
  MGLU3: "MGLU3.SA",
  IBOV: "%5EBVSP",
  BTC: "BTC-USD",
  ETH: "ETH-USD",
};

const INTERVAL_MAP: Record<string, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "60m",
  "1d": "1d",
};

const RANGE_MAP: Record<string, string> = {
  "1m": "1d",
  "5m": "5d",
  "15m": "1mo",
  "30m": "1mo",
  "1h": "3mo",
  "1d": "1y",
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const asset = (searchParams.get("asset") || "WIN").toUpperCase();
  const interval = searchParams.get("interval") || "5m";

  const symbol = SYMBOL_MAP[asset] || `${asset}.SA`;
  const yhInterval = INTERVAL_MAP[interval] || "5m";
  const range = RANGE_MAP[interval] || "5d";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yhInterval}&range=${range}&includePrePost=false`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) throw new Error("Sem dados para este ativo");

    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const meta = result.meta || {};

    const candles = timestamps
      .map((ts: number, i: number) => ({
        time: ts,
        open: quote.open?.[i] ?? null,
        high: quote.high?.[i] ?? null,
        low: quote.low?.[i] ?? null,
        close: quote.close?.[i] ?? null,
        volume: quote.volume?.[i] ?? null,
      }))
      .filter((c) => c.open != null && c.close != null);

    return NextResponse.json({
      symbol,
      asset,
      interval,
      currency: meta.currency || "BRL",
      currentPrice: meta.regularMarketPrice ?? candles.at(-1)?.close ?? null,
      previousClose: meta.previousClose ?? meta.chartPreviousClose ?? null,
      candles,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
