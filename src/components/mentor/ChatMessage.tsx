import { cn } from "@/lib/utils";
import { Brain, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export function ChatMessage({ role, content, image }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2 lg:gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 lg:h-8 lg:w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-zinc-900 dark:bg-zinc-100" : "bg-amber-500"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white dark:text-zinc-900" />
        ) : (
          <Brain className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[85%] lg:max-w-[75%] rounded-2xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm leading-relaxed",
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
        )}
      >
        {image && (
          <img
            src={image}
            alt="Gráfico enviado"
            className="rounded-lg mb-2 max-h-60 w-auto"
          />
        )}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : (
          <div className="mentor-markdown break-words">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="text-amber-600 dark:text-amber-400 not-italic font-medium">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="mb-2 ml-4 space-y-1 list-disc marker:text-amber-500">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-2 ml-4 space-y-1 list-decimal marker:text-amber-500 marker:font-semibold">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="pl-1 leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-amber-500 pl-3 my-2 text-zinc-600 dark:text-zinc-400 italic">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <pre className="bg-zinc-200 dark:bg-zinc-900 rounded-lg px-3 py-2 my-2 overflow-x-auto">
                        <code className="text-xs font-mono">{children}</code>
                      </pre>
                    );
                  }
                  return (
                    <code className="bg-zinc-200 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  );
                },
                hr: () => (
                  <hr className="my-3 border-zinc-200 dark:border-zinc-700" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
