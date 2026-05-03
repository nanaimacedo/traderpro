"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Plus,
  History,
  BookOpen,
  FileBarChart,
  Brain,
  Lightbulb,
  PlayCircle,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Nova Operação", href: "/trades/new", icon: Plus },
  { name: "Histórico", href: "/trades", icon: History },
  { name: "Diário", href: "/diary", icon: BookOpen },
  { name: "Relatórios", href: "/reports", icon: FileBarChart },
  { name: "Replays", href: "/replays", icon: PlayCircle },
  { name: "Insights", href: "/insights", icon: Lightbulb },
  { name: "Gemini", href: "/mentor", icon: Brain },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close button */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4">
          <Link href="/" onClick={onClose}>
            <Image
              src="/logo.png"
              alt="TraderPro"
              width={180}
              height={48}
              className="object-contain cursor-pointer"
              priority
            />
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <item.icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-zinc-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ativo Operado</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">WIN - Mini Índice</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">B3 - Bovespa</p>
          </div>
        </div>
      </aside>
    </>
  );
}
