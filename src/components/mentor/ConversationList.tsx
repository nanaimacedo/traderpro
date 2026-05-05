"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Trash2, Plus } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return "Hoje";
  if (d.getTime() === yesterday.getTime()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  // Group conversations by day
  const groups: { label: string; items: Conversation[] }[] = [];
  for (const conv of conversations) {
    const label = getDayLabel(conv.updatedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(conv);
    } else {
      groups.push({ label, items: [conv] });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500 capitalize">{today}</p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Nova Conversa
      </button>

      <div className="mt-3 flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="mb-1 px-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer",
                    activeId === conv.id
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  )}
                  onClick={() => onSelect(conv.id)}
                >
                  <MessageSquare className={cn("h-4 w-4 shrink-0", activeId === conv.id ? "text-white" : "text-zinc-400")} />
                  <span className="flex-1 truncate">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className={cn(
                      "shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer",
                      activeId === conv.id ? "hover:bg-zinc-700 dark:hover:bg-zinc-300" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    )}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
