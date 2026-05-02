"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Visao geral das suas operacoes" },
  "/trades/new": { title: "Nova Operacao", description: "Registrar uma nova operacao no WIN" },
  "/trades": { title: "Historico", description: "Todas as operacoes realizadas" },
  "/diary": { title: "Diario de Trade", description: "Registros e analises pessoais" },
  "/reports": { title: "Relatorios", description: "Relatorios da corretora" },
};

export function Header() {
  const pathname = usePathname();
  const page = pageTitles[pathname] || { title: "TraderPro", description: "" };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-100 bg-white/80 backdrop-blur-sm px-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{page.title}</h2>
        <p className="text-xs text-zinc-500">{page.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-zinc-400">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </header>
  );
}
