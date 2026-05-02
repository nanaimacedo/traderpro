import { cn } from "@/lib/utils";
import { Brain, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2 lg:gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 lg:h-8 lg:w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-zinc-900" : "bg-amber-500"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" />
        ) : (
          <Brain className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[85%] lg:max-w-[75%] rounded-2xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm leading-relaxed",
          isUser
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-800"
        )}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
      </div>
    </div>
  );
}
