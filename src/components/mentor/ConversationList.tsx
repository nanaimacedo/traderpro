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

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

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

      <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
        {conversations.map((conv) => (
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
  );
}
