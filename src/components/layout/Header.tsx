"use client";

import { usePathname, useRouter } from "next/navigation";
import { NotificationToggle } from "@/components/NotificationToggle";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Visão geral das suas operações" },
  "/trades/new": { title: "Nova Operação", description: "Registrar uma nova operação no WIN" },
  "/trades": { title: "Histórico", description: "Todas as operações realizadas" },
  "/diary": { title: "Diário & Setups", description: "Registros pessoais e analytics por setup" },
  "/reports": { title: "Relatórios", description: "Relatórios da corretora" },
  "/replays": { title: "Replays", description: "Estudos e simulações de mercado" },
  "/insights": { title: "Insights", description: "Análise semanal e mensal dos seus resultados" },
  "/analytics": { title: "Analytics", description: "Métricas institucionais e performance avançada" },
  "/setups": { title: "Setup Analytics", description: "Performance por setup operacional" },
  "/achievements": { title: "Conquistas", description: "XP, níveis, badges e conquistas" },
  "/trades/import": { title: "Importar Trades", description: "CSV do Profit, Tryd ou MetaTrader" },
  "/leaderboard": { title: "Leaderboard", description: "Ranking anonimo por Sharpe Ratio" },
  "/mentor": { title: "Gemini", description: "Seu mentor pessoal de trading" },
  "/chart": { title: "Gráfico IA", description: "TradingView ao vivo + análise Gemini de entrada e saída" },
  "/pricing": { title: "Planos", description: "Free vs Pro — escolha seu plano" },
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const page = pageTitles[pathname] || { title: "TraderPro", description: "" };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-zinc-900 dark:text-zinc-100">{page.title}</h2>
          <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400">{page.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <ThemeToggle />
        <NotificationToggle />
        <div className="hidden md:block text-right">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2 lg:px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          title="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
