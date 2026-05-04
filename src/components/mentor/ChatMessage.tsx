"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Brain, User, Volume2, VolumeX, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export function ChatMessage({ role, content, image }: ChatMessageProps) {
  const isUser = role === "user";
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function toggleTTS() {
    // Stop if playing
    if (speaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setSpeaking(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/speech/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const contentType = res.headers.get("content-type") || "audio/wav";
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: contentType });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setSpeaking(false);
        audioRef.current = null;
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setSpeaking(false);
        audioRef.current = null;
        URL.revokeObjectURL(url);
      };

      setSpeaking(true);
      setLoading(false);
      await audio.play();
    } catch {
      setLoading(false);
      setSpeaking(false);
    }
  }

  return (
    <div className={cn("flex gap-2 lg:gap-3 group", isUser && "flex-row-reverse")}>
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
      <div className="flex flex-col gap-1 max-w-[85%] lg:max-w-[75%]">
        <div
          className={cn(
            "rounded-2xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm leading-relaxed",
            isUser
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
          )}
        >
          {image && (
            <img
              src={image}
              alt="Grafico enviado"
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
        {/* TTS button for assistant messages */}
        {!isUser && (
          <button
            onClick={toggleTTS}
            disabled={loading}
            className={cn(
              "self-start flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer",
              loading
                ? "text-amber-500 bg-amber-50 dark:bg-amber-950"
                : speaking
                ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Gerando voz...
              </>
            ) : speaking ? (
              <>
                <VolumeX className="h-3 w-3" />
                Parar
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3" />
                Ouvir
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
