import { prisma } from "@/lib/prisma";

// Calendario economico com geracao automatica de eventos recorrentes
// Payroll = 1a sexta do mes, CPI/PPI = meados do mes, FOMC = 8 reunioes/ano

interface CalendarEvent {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm UTC
  title: string;
  country: string; // BR | US | EU
  impact: string; // LOW | MEDIUM | HIGH
}

// --- Helpers para gerar datas recorrentes ---

function getFirstFriday(year: number, month: number): Date {
  const d = new Date(year, month, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  return d;
}

function getFirstBusinessDay(year: number, month: number): Date {
  const d = new Date(year, month, 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

// Datas fixas do FOMC 2025-2026 (reunioes de 2 dias, decisao no 2o dia)
const FOMC_DATES = [
  // 2025
  "2025-01-29", "2025-03-19", "2025-05-07", "2025-06-18",
  "2025-07-30", "2025-09-17", "2025-11-05", "2025-12-17",
  // 2026
  "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17",
  "2026-07-29", "2026-09-16", "2026-11-04", "2026-12-16",
];

// Datas fixas do Copom 2025-2026
const COPOM_DATES = [
  // 2025
  "2025-01-29", "2025-03-19", "2025-05-07", "2025-06-18",
  "2025-07-30", "2025-09-17", "2025-10-29", "2025-12-10",
  // 2026
  "2026-01-28", "2026-03-18", "2026-05-06", "2026-06-17",
  "2026-07-29", "2026-09-16", "2026-10-28", "2026-12-09",
];

// Gera eventos para um mes especifico
function generateMonthEvents(year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  // NFP — 1a sexta do mes (dados do mes anterior)
  const nfp = getFirstFriday(year, month);
  events.push({
    date: fmt(nfp),
    time: "12:30",
    title: "Non-Farm Payroll (NFP)",
    country: "US",
    impact: "HIGH",
  });

  // Unemployment Rate — mesmo dia do NFP
  events.push({
    date: fmt(nfp),
    time: "12:30",
    title: "Taxa de Desemprego EUA",
    country: "US",
    impact: "HIGH",
  });

  // CPI — geralmente 2a ou 3a semana, ~dia 10-15
  const cpiDay = new Date(year, month, 12);
  while (cpiDay.getDay() === 0 || cpiDay.getDay() === 6) cpiDay.setDate(cpiDay.getDate() + 1);
  events.push({
    date: fmt(cpiDay),
    time: "12:30",
    title: "CPI (Inflacao EUA)",
    country: "US",
    impact: "HIGH",
  });

  // PPI — dia seguinte ao CPI geralmente
  const ppiDay = new Date(cpiDay);
  ppiDay.setDate(ppiDay.getDate() + 1);
  while (ppiDay.getDay() === 0 || ppiDay.getDay() === 6) ppiDay.setDate(ppiDay.getDate() + 1);
  events.push({
    date: fmt(ppiDay),
    time: "12:30",
    title: "PPI (Inflacao Produtor)",
    country: "US",
    impact: "MEDIUM",
  });

  // Retail Sales — ~dia 15-17
  const retail = new Date(year, month, 16);
  while (retail.getDay() === 0 || retail.getDay() === 6) retail.setDate(retail.getDate() + 1);
  events.push({
    date: fmt(retail),
    time: "12:30",
    title: "Retail Sales (Vendas Varejo EUA)",
    country: "US",
    impact: "HIGH",
  });

  // ISM Manufacturing — 1o dia util do mes
  const ism = getFirstBusinessDay(year, month);
  events.push({
    date: fmt(ism),
    time: "14:00",
    title: "ISM Manufacturing PMI",
    country: "US",
    impact: "HIGH",
  });

  // Jobless Claims — toda quinta-feira
  const firstThursday = new Date(year, month, 1);
  while (firstThursday.getDay() !== 4) firstThursday.setDate(firstThursday.getDate() + 1);
  for (let d = new Date(firstThursday); d.getMonth() === month; d.setDate(d.getDate() + 7)) {
    events.push({
      date: fmt(new Date(d)),
      time: "12:30",
      title: "Pedidos Seguro Desemprego (Jobless Claims)",
      country: "US",
      impact: "MEDIUM",
    });
  }

  // FOMC — verificar se tem neste mes
  for (const fomcDate of FOMC_DATES) {
    if (fomcDate.startsWith(monthStr)) {
      events.push({
        date: fomcDate,
        time: "18:00",
        title: "Decisao Fed Funds Rate (FOMC)",
        country: "US",
        impact: "HIGH",
      });
      // FOMC Minutes — 3 semanas depois
      const minutes = new Date(fomcDate);
      minutes.setDate(minutes.getDate() + 21);
      while (minutes.getDay() === 0 || minutes.getDay() === 6) minutes.setDate(minutes.getDate() + 1);
      events.push({
        date: fmt(minutes),
        time: "18:00",
        title: "FOMC Minutes (Ata do Fed)",
        country: "US",
        impact: "HIGH",
      });
    }
  }

  // === BRASIL ===

  // IPCA — ~dia 10 do mes
  const ipca = new Date(year, month, 10);
  while (ipca.getDay() === 0 || ipca.getDay() === 6) ipca.setDate(ipca.getDate() + 1);
  events.push({
    date: fmt(ipca),
    time: "12:00",
    title: "IPCA (Inflacao Brasil)",
    country: "BR",
    impact: "HIGH",
  });

  // Copom — verificar se tem neste mes
  for (const copomDate of COPOM_DATES) {
    if (copomDate.startsWith(monthStr)) {
      events.push({
        date: copomDate,
        time: "21:30",
        title: "Decisao Selic (Copom)",
        country: "BR",
        impact: "HIGH",
      });
    }
  }

  // PIB Brasil — trimestral (mar, jun, set, dez), ~dia 1 do mes seguinte
  if ([2, 5, 8, 11].includes(month)) {
    const pibDay = new Date(year, month, 1);
    while (pibDay.getDay() === 0 || pibDay.getDay() === 6) pibDay.setDate(pibDay.getDate() + 1);
    events.push({
      date: fmt(pibDay),
      time: "12:00",
      title: "PIB Brasil (Trimestral)",
      country: "BR",
      impact: "HIGH",
    });
  }

  return events;
}

// Gera eventos para os proximos N meses a partir de hoje
export function generateUpcomingEvents(months: number = 2): CalendarEvent[] {
  const now = new Date();
  const events: CalendarEvent[] = [];

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    events.push(...generateMonthEvents(d.getFullYear(), d.getMonth()));
  }

  // Filtrar apenas eventos futuros (hoje em diante)
  const todayStr = fmt(now);
  return events.filter((e) => e.date >= todayStr);
}

// Sync: popula o DB com eventos gerados
export async function syncCalendarEvents(months: number = 2): Promise<number> {
  const events = generateUpcomingEvents(months);
  let count = 0;

  for (const event of events) {
    const id = `${event.date}-${event.title}`.replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 50);

    const existing = await prisma.economicEvent.findFirst({
      where: {
        date: new Date(event.date),
        title: event.title,
      },
    });

    if (!existing) {
      await prisma.economicEvent.create({
        data: {
          date: new Date(event.date),
          time: event.time,
          title: event.title,
          country: event.country,
          impact: event.impact,
        },
      });
      count++;
    }
  }

  return count;
}

// Buscar eventos de hoje
export async function getTodayEvents(): Promise<any[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.economicEvent.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    orderBy: [{ impact: "desc" }, { time: "asc" }],
  });
}

// Buscar eventos da semana
export async function getWeekEvents(): Promise<any[]> {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  end.setHours(23, 59, 59, 999);

  return prisma.economicEvent.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: [{ date: "asc" }, { impact: "desc" }, { time: "asc" }],
  });
}

// Formatar para injecao no mentor
export function formatEventsForMentor(events: any[]): string {
  if (events.length === 0) return "";

  const highImpact = events.filter((e: any) => e.impact === "HIGH");
  const lines = events.map((e: any) => {
    const flag = e.country === "BR" ? "BR" : e.country === "US" ? "US" : "EU";
    const icon = e.impact === "HIGH" ? "!!!" : e.impact === "MEDIUM" ? "!!" : "!";
    const timeStr = e.time ? `${e.time} UTC` : "TBD";
    return `- [${flag}] ${timeStr} ${icon} ${e.title}${e.forecast ? ` (prev: ${e.forecast})` : ""}`;
  }).join("\n");

  let warning = "";
  if (highImpact.length > 0) {
    const names = highImpact.map((e: any) => e.title).join(", ");
    warning = `\n\nALERTA: ${highImpact.length} evento(s) de ALTO IMPACTO hoje (${names}). Considere reduzir exposicao ou nao operar nos horarios criticos. Payroll e FOMC sao os mais perigosos — volatilidade extrema nos 30min antes e depois.`;
  }

  return `## CALENDARIO ECONOMICO HOJE\n${lines}${warning}`;
}

// Formatar eventos da semana para contexto
export function formatWeekEventsForMentor(events: any[]): string {
  if (events.length === 0) return "";

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const grouped = new Map<string, any[]>();

  for (const e of events) {
    const d = new Date(e.date);
    const key = `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
    const list = grouped.get(key) || [];
    list.push(e);
    grouped.set(key, list);
  }

  const lines: string[] = [];
  for (const [day, evts] of grouped) {
    const highCount = evts.filter((e: any) => e.impact === "HIGH").length;
    const dayLabel = highCount > 0 ? `**${day}** (${highCount} HIGH)` : day;
    lines.push(dayLabel);
    for (const e of evts) {
      const icon = e.impact === "HIGH" ? "!!!" : "!!";
      lines.push(`  - [${e.country}] ${e.time || "TBD"} ${icon} ${e.title}`);
    }
  }

  return `## CALENDARIO DA SEMANA\n${lines.join("\n")}`;
}
