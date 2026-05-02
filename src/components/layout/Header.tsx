"use client";

import { usePathname, useRouter } from "next/navigation";
import { NotificationToggle } from "@/components/NotificationToggle";
import { LogOut, Menu } from "lucide-react";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Visão geral das suas operações" },
  "/trades/new": { title: "Nova Operação", description: "Registrar uma nova operação no WIN" },
  "/trades": { title: "Histórico", description: "Todas as operações realizadas" },
  "/diary": { title: "Diário de Trade", description: "Registros e análises pessoais" },
  "/reports": { title: "Relatórios", description: "Relatórios da corretora" },
  "/insights": { title: "Insights", description: "Análise semanal e mensal dos seus resultados" },
  "/mentor": { title: "Mentor", description: "Seu mentor pessoal de trading" },
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
    <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between border-b border-zinc-100 bg-white/80 backdrop-blur-sm px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-zinc-900">{page.title}</h2>
          <p className="hidden sm:block text-xs text-zinc-500">{page.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <NotificationToggle />
        <div className="hidden md:block text-right">
          <p className="text-xs text-zinc-400">
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
          className="flex items-center gap-1.5 rounded-lg px-2 lg:px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
          title="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
