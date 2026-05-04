"use client";

import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { formatDuration } from "@/lib/calculations";

interface Trade {
  date: string;
  time: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  contracts: number;
  result: string;
  points: number;
  financialResult: number;
}

interface DailyResult {
  date: string;
  gain: number;
  loss: number;
  net: number;
  trades: number;
}

interface ReportData {
  period: string;
  generatedAt: string;
  metrics: {
    totalTrades: number;
    gains: number;
    losses: number;
    zeros: number;
    winRate: number;
    totalGain: number;
    totalLoss: number;
    netResult: number;
    totalPoints: number;
    avgPointsPerTrade: number;
    totalContracts: number;
    maxWinStreak: number;
    maxLossStreak: number;
    tradingDays: number;
    maxDailyGain: number;
    maxDailyLoss: number;
    maxGainPerOp: number;
    maxLossPerOp: number;
    maxDurationTrade: { minutes: number; financialResult: number } | null;
    minDurationTrade: { minutes: number; financialResult: number } | null;
  };
  payoffRatio: number;
  trades: Trade[];
  dailyResults: DailyResult[];
}

function DonutSVG({ gains, losses, zeros, size = 120 }: { gains: number; losses: number; zeros: number; size?: number }) {
  const total = gains + losses + zeros;
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.65;

  const slices = [
    { value: gains, color: "#059669", label: "Gain" },
    { value: losses, color: "#f43f5e", label: "Loss" },
    ...(zeros > 0 ? [{ value: zeros, color: "#a1a1aa", label: "Zero" }] : []),
  ];

  let currentAngle = -90;
  const arcs = slices.map((slice) => {
    const sliceDeg = (slice.value / total) * 360;
    const startAngle = currentAngle + 1;
    const endAngle = currentAngle + sliceDeg - 1;
    currentAngle += sliceDeg;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1O = cx + outerR * Math.cos(startRad);
    const y1O = cy + outerR * Math.sin(startRad);
    const x2O = cx + outerR * Math.cos(endRad);
    const y2O = cy + outerR * Math.sin(endRad);
    const x1I = cx + innerR * Math.cos(endRad);
    const y1I = cy + innerR * Math.sin(endRad);
    const x2I = cx + innerR * Math.cos(startRad);
    const y2I = cy + innerR * Math.sin(startRad);
    const large = sliceDeg - 2 > 180 ? 1 : 0;

    const d = `M ${x1O} ${y1O} A ${outerR} ${outerR} 0 ${large} 1 ${x2O} ${y2O} L ${x1I} ${y1I} A ${innerR} ${innerR} 0 ${large} 0 ${x2I} ${y2I} Z`;
    return { d, color: slice.color };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => <path key={i} d={arc.d} fill={arc.color} />)}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#18181b">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fontWeight="600" fill="#a1a1aa" letterSpacing="1">TRADES</text>
    </svg>
  );
}

function GaugeSVG({ value, size = 120 }: { value: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const offset = circumference - progress;
  const color = value >= 60 ? "#059669" : value >= 40 ? "#f59e0b" : "#f43f5e";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      <g style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>{value.toFixed(1)}%</text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize="7" fontWeight="600" fill="#a1a1aa" letterSpacing="1">WIN RATE</text>
      </g>
    </svg>
  );
}

function BarChartSVG({ data }: { data: DailyResult[] }) {
  if (data.length === 0) return <p style={{ color: "#a1a1aa", fontSize: 12, textAlign: "center" }}>Sem dados</p>;

  const maxVal = Math.max(...data.map(d => Math.max(d.gain, Math.abs(d.loss))), 1);
  const barW = Math.min(30, Math.floor(500 / data.length) - 4);
  const h = 160;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${data.length * (barW + 4) + 20} ${h}`}>
      {data.map((d, i) => {
        const x = i * (barW + 4) + 10;
        const gainH = (d.gain / maxVal) * (h - 30);
        const lossH = (Math.abs(d.loss) / maxVal) * (h - 30);
        return (
          <g key={i}>
            {d.gain > 0 && <rect x={x} y={h - 20 - gainH} width={barW / 2 - 1} height={gainH} rx={3} fill="#059669" />}
            {d.loss < 0 && <rect x={x + barW / 2} y={h - 20 - lossH} width={barW / 2 - 1} height={lossH} rx={3} fill="#f43f5e" />}
            <text x={x + barW / 4} y={h - 6} textAnchor="middle" fontSize="7" fill="#a1a1aa">
              {d.date.slice(5).replace("-", "/")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ReportPrintView({ data }: { data: ReportData }) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, []);

  const m = data.metrics;

  return (
    <>
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          @page { margin: 12mm 10mm; size: A4; }
        }
        .report-body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #18181b;
          background: white;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .kpi-card {
          border: 1px solid #e4e4e7;
          border-radius: 10px;
          padding: 14px;
          position: relative;
          overflow: hidden;
        }
        .kpi-card .accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .kpi-label { font-size: 9px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; }
        .kpi-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
        .kpi-sub { font-size: 10px; color: #a1a1aa; margin-top: 2px; }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 24px 0 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #f4f4f5;
        }
        .trades-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .trades-table th {
          text-align: left;
          font-size: 8px;
          font-weight: 600;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 6px 8px;
          border-bottom: 1px solid #e4e4e7;
        }
        .trades-table td { padding: 5px 8px; border-bottom: 1px solid #f4f4f5; }
        .trades-table tr:nth-child(even) { background: #fafafa; }
        .badge {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
        }
        .badge-gain { background: #ecfdf5; color: #059669; }
        .badge-loss { background: #fff1f2; color: #f43f5e; }
        .badge-zero { background: #f4f4f5; color: #71717a; }
        .text-gain { color: #059669; }
        .text-loss { color: #f43f5e; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .charts-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: center; }
        .chart-box { text-align: center; }
        .chart-label { font-size: 10px; font-weight: 600; color: #71717a; margin-top: 8px; }
        .stats-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .stats-table td { padding: 5px 10px; border-bottom: 1px solid #f4f4f5; }
        .stats-table tr:nth-child(even) { background: #fafafa; }
        .stats-table .stat-label { color: #52525b; font-weight: 500; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
        .stats-table .stat-value { text-align: right; font-weight: 700; font-size: 10px; color: #18181b; white-space: nowrap; }
        .stats-table .stat-sub { text-align: right; font-size: 9px; color: #71717a; padding-left: 6px; white-space: nowrap; }
        .stats-table .stat-separator td { padding: 4px 0; border: none; background: transparent; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ position: "fixed", top: 16, right: 16, zIndex: 100, display: "flex", gap: 8 }}>
        <button
          onClick={() => window.print()}
          style={{ background: "#18181b", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Salvar PDF
        </button>
        <button
          onClick={() => window.history.back()}
          style={{ background: "#f4f4f5", color: "#71717a", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Voltar
        </button>
      </div>

      <div className="report-body">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "2px solid #18181b" }}>
          <div>
            <img src="/logo.png" alt="TraderPro" style={{ height: 40, objectFit: "contain" }} />
            <p style={{ fontSize: 10, color: "#a1a1aa", marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>Relatório de Performance</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}>{data.period}</p>
            <p style={{ fontSize: 9, color: "#a1a1aa", marginTop: 2 }}>Gerado em {data.generatedAt}</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="section-title">Métricas Principais</div>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="accent" style={{ background: m.netResult >= 0 ? "#059669" : "#f43f5e" }} />
            <div className="kpi-label">Resultado Líquido</div>
            <div className="kpi-value" style={{ color: m.netResult >= 0 ? "#059669" : "#f43f5e" }}>{formatCurrency(m.netResult)}</div>
            <div className="kpi-sub">{m.totalPoints > 0 ? "+" : ""}{m.totalPoints.toFixed(1)} pontos</div>
          </div>
          <div className="kpi-card">
            <div className="accent" style={{ background: m.winRate >= 50 ? "#059669" : "#f43f5e" }} />
            <div className="kpi-label">Win Rate</div>
            <div className="kpi-value" style={{ color: m.winRate >= 50 ? "#059669" : "#f43f5e" }}>{m.winRate.toFixed(1)}%</div>
            <div className="kpi-sub">{m.gains}G / {m.losses}L / {m.zeros}Z</div>
          </div>
          <div className="kpi-card">
            <div className="accent" style={{ background: "#18181b" }} />
            <div className="kpi-label">Total Trades</div>
            <div className="kpi-value">{m.totalTrades}</div>
            <div className="kpi-sub">{m.totalContracts} contratos</div>
          </div>
          <div className="kpi-card">
            <div className="accent" style={{ background: data.payoffRatio >= 1.5 ? "#059669" : "#f59e0b" }} />
            <div className="kpi-label">Payoff Ratio</div>
            <div className="kpi-value">{data.payoffRatio > 0 ? data.payoffRatio.toFixed(2) : "—"}</div>
            <div className="kpi-sub">Média {m.avgPointsPerTrade > 0 ? "+" : ""}{m.avgPointsPerTrade.toFixed(1)} pts/trade</div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="kpi-grid" style={{ marginTop: 12 }}>
          <div className="kpi-card">
            <div className="kpi-label">Total Gains</div>
            <div className="kpi-value text-gain" style={{ fontSize: 16 }}>{formatCurrency(m.totalGain)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Losses</div>
            <div className="kpi-value text-loss" style={{ fontSize: 16 }}>{formatCurrency(Math.abs(m.totalLoss))}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Seq. Vencedora</div>
            <div className="kpi-value" style={{ fontSize: 16 }}>{m.maxWinStreak} trades</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Seq. Perdedora</div>
            <div className="kpi-value" style={{ fontSize: 16 }}>{m.maxLossStreak} trades</div>
          </div>
        </div>

        {/* Resumo Estatístico — estilo relatório de corretora */}
        <div className="section-title">Resumo Estatístico</div>
        <div className="stats-grid">
          {/* Coluna esquerda */}
          <table className="stats-table">
            <tbody>
              <tr>
                <td className="stat-label">Quant. Dias Operados</td>
                <td className="stat-value">{m.tradingDays}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr>
                <td className="stat-label">Operações Totais</td>
                <td className="stat-value">{m.totalTrades}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr>
                <td className="stat-label">Quant. Op. Gain</td>
                <td className="stat-value" style={{ color: "#059669" }}>{m.gains}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr>
                <td className="stat-label">Quant. Op. Loss</td>
                <td className="stat-value" style={{ color: "#f43f5e" }}>{m.losses}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr>
                <td className="stat-label">Op. Zeradas</td>
                <td className="stat-value" style={{ color: "#71717a" }}>{m.zeros}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr className="stat-separator"><td colSpan={3}></td></tr>
              <tr>
                <td className="stat-label">Maior Tempo por Op.</td>
                <td className="stat-value">{m.maxDurationTrade ? formatDuration(m.maxDurationTrade.minutes) : "—"}</td>
                <td className="stat-sub">{m.maxDurationTrade ? formatCurrency(m.maxDurationTrade.financialResult) : ""}</td>
              </tr>
              <tr>
                <td className="stat-label">Menor Tempo por Op.</td>
                <td className="stat-value">{m.minDurationTrade ? formatDuration(m.minDurationTrade.minutes) : "—"}</td>
                <td className="stat-sub">{m.minDurationTrade ? formatCurrency(m.minDurationTrade.financialResult) : ""}</td>
              </tr>
            </tbody>
          </table>

          {/* Coluna direita */}
          <table className="stats-table">
            <tbody>
              <tr>
                <td className="stat-label">Maior Gain Diário</td>
                <td className="stat-value" style={{ color: "#059669" }}>{m.maxDailyGain > 0 ? formatCurrency(m.maxDailyGain) : "—"}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr>
                <td className="stat-label">Maior Loss Diário</td>
                <td className="stat-value" style={{ color: "#f43f5e" }}>{m.maxDailyLoss < 0 ? formatCurrency(m.maxDailyLoss) : "—"}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr className="stat-separator"><td colSpan={3}></td></tr>
              <tr>
                <td className="stat-label">Maior Gain por Op.</td>
                <td className="stat-value" style={{ color: "#059669" }}>{m.maxGainPerOp > 0 ? formatCurrency(m.maxGainPerOp) : "—"}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr>
                <td className="stat-label">Maior Loss por Op.</td>
                <td className="stat-value" style={{ color: "#f43f5e" }}>{m.maxLossPerOp < 0 ? formatCurrency(m.maxLossPerOp) : "—"}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr className="stat-separator"><td colSpan={3}></td></tr>
              <tr>
                <td className="stat-label">Valor Total Gain</td>
                <td className="stat-value" style={{ color: "#059669" }}>{formatCurrency(m.totalGain)}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr>
                <td className="stat-label">Valor Total Loss</td>
                <td className="stat-value" style={{ color: "#f43f5e" }}>{formatCurrency(m.totalLoss)}</td>
                <td className="stat-sub"></td>
              </tr>
              <tr style={{ background: m.netResult >= 0 ? "#ecfdf5" : "#fff1f2" }}>
                <td className="stat-label" style={{ fontWeight: 700, color: "#18181b", fontSize: 10 }}>Resultado Final</td>
                <td className="stat-value" style={{ color: m.netResult >= 0 ? "#059669" : "#f43f5e", fontSize: 12 }}>{formatCurrency(m.netResult)}</td>
                <td className="stat-sub"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Charts */}
        <div className="section-title">Visualização</div>
        <div className="charts-row">
          <div className="chart-box">
            <GaugeSVG value={m.winRate} />
            <div className="chart-label">Win Rate</div>
          </div>
          <div className="chart-box">
            <DonutSVG gains={m.gains} losses={m.losses} zeros={m.zeros} />
            <div className="chart-label">Distribuição</div>
          </div>
          <div className="chart-box">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#71717a", marginBottom: 3 }}>
                  <span>Gains</span>
                  <span style={{ color: "#059669", fontWeight: 600 }}>{m.gains}</span>
                </div>
                <div style={{ height: 6, background: "#f4f4f5", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#059669", borderRadius: 3, width: `${m.totalTrades > 0 ? (m.gains / m.totalTrades) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#71717a", marginBottom: 3 }}>
                  <span>Losses</span>
                  <span style={{ color: "#f43f5e", fontWeight: 600 }}>{m.losses}</span>
                </div>
                <div style={{ height: 6, background: "#f4f4f5", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#f43f5e", borderRadius: 3, width: `${m.totalTrades > 0 ? (m.losses / m.totalTrades) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#71717a", marginBottom: 3 }}>
                  <span>Zeros</span>
                  <span style={{ color: "#a1a1aa", fontWeight: 600 }}>{m.zeros}</span>
                </div>
                <div style={{ height: 6, background: "#f4f4f5", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#a1a1aa", borderRadius: 3, width: `${m.totalTrades > 0 ? (m.zeros / m.totalTrades) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="chart-label">Composição</div>
          </div>
        </div>

        {/* Daily Bar Chart */}
        <div className="section-title">Resultado Diário</div>
        <div style={{ border: "1px solid #e4e4e7", borderRadius: 10, padding: 16, marginBottom: 8 }}>
          <BarChartSVG data={data.dailyResults} />
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#059669" }} />
              <span style={{ fontSize: 9, color: "#71717a" }}>Ganhos</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f43f5e" }} />
              <span style={{ fontSize: 9, color: "#71717a" }}>Perdas</span>
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="section-title">Operações Detalhadas</div>
        <table className="trades-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Direção</th>
              <th className="text-right">Entrada</th>
              <th className="text-right">Saída</th>
              <th className="text-center">Cts</th>
              <th className="text-center">Resultado</th>
              <th className="text-right">Pontos</th>
              <th className="text-right">Financeiro</th>
            </tr>
          </thead>
          <tbody>
            {data.trades.map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.time}</td>
                <td>
                  <span className={`badge ${t.direction === "COMPRA" ? "badge-gain" : "badge-loss"}`}>
                    {t.direction}
                  </span>
                </td>
                <td className="text-right" style={{ fontFamily: "monospace" }}>{t.entryPrice.toLocaleString("pt-BR")}</td>
                <td className="text-right" style={{ fontFamily: "monospace" }}>{t.exitPrice.toLocaleString("pt-BR")}</td>
                <td className="text-center">{t.contracts}</td>
                <td className="text-center">
                  <span className={`badge ${t.result === "GAIN" ? "badge-gain" : t.result === "LOSS" ? "badge-loss" : "badge-zero"}`}>
                    {t.result}
                  </span>
                </td>
                <td className={`text-right ${t.points > 0 ? "text-gain" : t.points < 0 ? "text-loss" : ""}`} style={{ fontFamily: "monospace", fontWeight: 600 }}>
                  {t.points > 0 ? "+" : ""}{t.points.toFixed(1)}
                </td>
                <td className={`text-right ${t.financialResult > 0 ? "text-gain" : t.financialResult < 0 ? "text-loss" : ""}`} style={{ fontWeight: 600 }}>
                  {formatCurrency(t.financialResult)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #e4e4e7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <img src="/logo.png" alt="TraderPro" style={{ height: 20, objectFit: "contain" }} />
          <p style={{ fontSize: 8, color: "#a1a1aa" }}>
            Documento gerado automaticamente — WIN Mini Índice — B3 Bovespa
          </p>
        </div>
      </div>
    </>
  );
}
