// CSV parsers for different trading platforms

export interface ParsedTrade {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  direction: "COMPRA" | "VENDA";
  entryPrice: number;
  exitPrice: number;
  contracts: number;
  asset: string;
  durationMinutes?: number;
  notes?: string;
}

export interface ParseResult {
  trades: ParsedTrade[];
  errors: string[];
  platform: string;
}

function detectPlatform(headers: string[]): string {
  const h = headers.map((s) => s.toLowerCase().trim());
  if (h.some((s) => s.includes("profit") || s.includes("nelogica"))) return "profit";
  if (h.some((s) => s.includes("tryd"))) return "tryd";
  if (h.some((s) => s.includes("ticket") && s.includes("magic"))) return "metatrader";
  if (h.some((s) => s.includes("order") || s.includes("type"))) return "metatrader";
  // Generic detection by column patterns
  if (h.includes("data") && h.includes("hora")) return "profit";
  if (h.includes("date") && h.includes("time") && h.includes("type")) return "metatrader";
  return "generic";
}

function parseDate(raw: string): string | null {
  // Try DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  // Try YYYY-MM-DD
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  // Try YYYY.MM.DD
  const ydot = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (ydot) return `${ydot[1]}-${ydot[2]}-${ydot[3]}`;
  return null;
}

function parseTime(raw: string): string {
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return "09:00";
}

function parseNumber(raw: string): number {
  return parseFloat(raw.replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "," || char === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseProfit(rows: string[][], headers: string[]): ParseResult {
  const trades: ParsedTrade[] = [];
  const errors: string[] = [];
  const h = headers.map((s) => s.toLowerCase().trim());

  const dateIdx = h.findIndex((s) => s.includes("data"));
  const timeIdx = h.findIndex((s) => s.includes("hora") || s.includes("horario"));
  const dirIdx = h.findIndex((s) => s.includes("tipo") || s.includes("lado") || s.includes("direcao") || s.includes("c/v"));
  const entryIdx = h.findIndex((s) => s.includes("entrada") || s.includes("preco_entrada") || s.includes("preço"));
  const exitIdx = h.findIndex((s) => s.includes("saida") || s.includes("saída") || s.includes("preco_saida"));
  const qtyIdx = h.findIndex((s) => s.includes("contrato") || s.includes("qtd") || s.includes("quantidade") || s.includes("lote"));
  const assetIdx = h.findIndex((s) => s.includes("ativo") || s.includes("papel") || s.includes("instrumento"));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const date = parseDate(row[dateIdx] || "");
      if (!date) { errors.push(`Linha ${i + 2}: data inválida "${row[dateIdx]}"`); continue; }

      const time = timeIdx >= 0 ? parseTime(row[timeIdx]) : "09:00";
      const dirRaw = (row[dirIdx] || "").toUpperCase().trim();
      const direction: "COMPRA" | "VENDA" = dirRaw.startsWith("C") || dirRaw === "BUY" || dirRaw === "COMPRA" ? "COMPRA" : "VENDA";
      const entryPrice = parseNumber(row[entryIdx] || "0");
      const exitPrice = parseNumber(row[exitIdx] || "0");
      const contracts = parseInt(row[qtyIdx] || "1") || 1;
      const asset = assetIdx >= 0 ? (row[assetIdx] || "WIN").toUpperCase() : "WIN";

      if (entryPrice <= 0 || exitPrice <= 0) { errors.push(`Linha ${i + 2}: preços inválidos`); continue; }

      trades.push({ date, time, direction, entryPrice, exitPrice, contracts, asset });
    } catch {
      errors.push(`Linha ${i + 2}: erro ao processar`);
    }
  }
  return { trades, errors, platform: "Profit (Nelogica)" };
}

function parseMetaTrader(rows: string[][], headers: string[]): ParseResult {
  const trades: ParsedTrade[] = [];
  const errors: string[] = [];
  const h = headers.map((s) => s.toLowerCase().trim());

  const dateIdx = h.findIndex((s) => s.includes("date") || s.includes("time") || s.includes("open time"));
  const typeIdx = h.findIndex((s) => s === "type" || s.includes("tipo"));
  const priceIdx = h.findIndex((s) => s === "price" || s.includes("open price"));
  const closePriceIdx = h.findIndex((s) => s.includes("close price") || s.includes("s/l") === false);
  const lotIdx = h.findIndex((s) => s.includes("lot") || s.includes("volume"));
  const symbolIdx = h.findIndex((s) => s.includes("symbol") || s.includes("ativo"));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const dateRaw = row[dateIdx] || "";
      const date = parseDate(dateRaw.split(" ")[0]);
      if (!date) { errors.push(`Linha ${i + 2}: data inválida`); continue; }

      const time = parseTime(dateRaw);
      const typeRaw = (row[typeIdx] || "").toLowerCase();
      if (!typeRaw.includes("buy") && !typeRaw.includes("sell")) continue; // skip balance/deposit rows

      const direction: "COMPRA" | "VENDA" = typeRaw.includes("buy") ? "COMPRA" : "VENDA";
      const entryPrice = parseNumber(row[priceIdx] || "0");

      // MetaTrader close price might be in different column
      let exitPrice = 0;
      for (let j = priceIdx + 1; j < row.length; j++) {
        const val = parseNumber(row[j]);
        if (val > 0 && val !== entryPrice) { exitPrice = val; break; }
      }
      if (closePriceIdx >= 0) exitPrice = parseNumber(row[closePriceIdx] || "0") || exitPrice;

      const contracts = Math.max(1, Math.round(parseNumber(row[lotIdx] || "1")));
      const asset = symbolIdx >= 0 ? (row[symbolIdx] || "WIN").toUpperCase() : "WIN";

      if (entryPrice <= 0 || exitPrice <= 0) { errors.push(`Linha ${i + 2}: preços inválidos`); continue; }

      trades.push({ date, time, direction, entryPrice, exitPrice, contracts, asset });
    } catch {
      errors.push(`Linha ${i + 2}: erro ao processar`);
    }
  }
  return { trades, errors, platform: "MetaTrader" };
}

function parseGeneric(rows: string[][], headers: string[]): ParseResult {
  // Best-effort: try to map any CSV with date, price columns
  const h = headers.map((s) => s.toLowerCase().trim());
  const trades: ParsedTrade[] = [];
  const errors: string[] = [];

  // Try to find columns by content analysis
  let dateIdx = h.findIndex((s) => s.includes("dat"));
  let timeIdx = h.findIndex((s) => s.includes("hor") || s.includes("time"));
  let dirIdx = h.findIndex((s) => s.includes("dir") || s.includes("tipo") || s.includes("type") || s.includes("lado") || s.includes("c/v"));

  // Find price columns — look for two numeric columns
  const numericIdxs: number[] = [];
  if (rows.length > 0) {
    for (let j = 0; j < headers.length; j++) {
      if (j === dateIdx || j === timeIdx || j === dirIdx) continue;
      const val = parseNumber(rows[0][j] || "");
      if (val > 1000) numericIdxs.push(j); // likely prices for WIN (>100k range)
    }
  }

  const entryIdx = h.findIndex((s) => s.includes("entr") || s.includes("open")) >= 0
    ? h.findIndex((s) => s.includes("entr") || s.includes("open"))
    : numericIdxs[0] ?? -1;
  const exitIdx = h.findIndex((s) => s.includes("said") || s.includes("saíd") || s.includes("close") || s.includes("exit")) >= 0
    ? h.findIndex((s) => s.includes("said") || s.includes("saíd") || s.includes("close") || s.includes("exit"))
    : numericIdxs[1] ?? -1;
  const qtyIdx = h.findIndex((s) => s.includes("cont") || s.includes("qtd") || s.includes("lot") || s.includes("vol"));

  if (dateIdx < 0) dateIdx = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const date = parseDate(row[dateIdx] || "");
      if (!date) { errors.push(`Linha ${i + 2}: data inválida`); continue; }

      const time = timeIdx >= 0 ? parseTime(row[timeIdx]) : "09:00";
      const dirRaw = dirIdx >= 0 ? (row[dirIdx] || "").toUpperCase() : "";
      const direction: "COMPRA" | "VENDA" = dirRaw.startsWith("C") || dirRaw.includes("BUY") || dirRaw.includes("COMPRA") ? "COMPRA" : "VENDA";

      const entryPrice = entryIdx >= 0 ? parseNumber(row[entryIdx]) : 0;
      const exitPrice = exitIdx >= 0 ? parseNumber(row[exitIdx]) : 0;
      const contracts = qtyIdx >= 0 ? Math.max(1, parseInt(row[qtyIdx]) || 1) : 1;

      if (entryPrice <= 0 || exitPrice <= 0) { errors.push(`Linha ${i + 2}: preços inválidos`); continue; }

      trades.push({ date, time, direction, entryPrice, exitPrice, contracts, asset: "WIN" });
    } catch {
      errors.push(`Linha ${i + 2}: erro ao processar`);
    }
  }
  return { trades, errors, platform: "Genérico" };
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { trades: [], errors: ["Arquivo vazio ou sem dados"], platform: "unknown" };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);

  const platform = detectPlatform(headers);

  switch (platform) {
    case "profit": return parseProfit(rows, headers);
    case "tryd": return parseProfit(rows, headers); // Tryd uses similar format
    case "metatrader": return parseMetaTrader(rows, headers);
    default: return parseGeneric(rows, headers);
  }
}
