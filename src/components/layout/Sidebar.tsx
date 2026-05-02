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
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Nova Operacao", href: "/trades/new", icon: Plus },
  { name: "Historico", href: "/trades", icon: History },
  { name: "Diario", href: "/diary", icon: BookOpen },
  { name: "Relatorios", href: "/reports", icon: FileBarChart },
  { name: "Mentor", href: "/mentor", icon: Brain },
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
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-zinc-100 bg-white transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close button */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-4">
          <Image
            src="/logo.png"
            alt="TraderPro"
            width={180}
            height={48}
            className="object-contain"
            priority
          />
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
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <item.icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-zinc-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-100 p-4">
          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs font-medium text-zinc-500">Ativo Operado</p>
            <p className="text-sm font-bold text-zinc-900">WIN - Mini Indice</p>
            <p className="text-[10px] text-zinc-400 mt-1">B3 - Bovespa</p>
          </div>
        </div>
      </aside>
    </>
  );
}
