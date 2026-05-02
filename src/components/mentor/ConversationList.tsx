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
  return (
    <div className="flex h-full flex-col">
      <button
        onClick={onNew}
        className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-50 cursor-pointer"
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
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-50"
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
                activeId === conv.id ? "hover:bg-zinc-700" : "hover:bg-zinc-200"
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
