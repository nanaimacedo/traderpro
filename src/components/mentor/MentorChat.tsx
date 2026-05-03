"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ConversationList } from "./ConversationList";
import { Brain, Loader2, MessageSquare, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  image?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
}

interface MentorChatProps {
  tradesContext: string;
}

export function MentorChat({ tradesContext }: MentorChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    setLoadingConversations(true);
    const res = await fetch("/api/mentor/conversations");
    const data = await res.json();
    setConversations(data);
    setLoadingConversations(false);
  }

  async function loadConversation(id: string) {
    setActiveConversationId(id);
    setShowSidebar(false);
    const res = await fetch(`/api/mentor/conversations/${id}`);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  function handleNewConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setShowSidebar(false);
  }

  async function handleDeleteConversation(id: string) {
    await fetch("/api/mentor/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    fetchConversations();
  }

  async function handleSend(message: string, image?: string) {
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: image ? `[Imagem enviada]\n${message}` : message,
      createdAt: new Date().toISOString(),
      image,
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    const res = await fetch("/api/mentor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        image,
        conversationId: activeConversationId,
        tradesContext,
      }),
    });

    const data = await res.json();

    if (data.error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Erro: ${data.error}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } else {
      if (!activeConversationId) {
        setActiveConversationId(data.conversationId);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `resp-${Date.now()}`,
          role: "assistant",
          content: data.message,
          createdAt: new Date().toISOString(),
        },
      ]);
      fetchConversations();
    }
    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)] gap-0 lg:gap-4">
      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar de conversas — desktop always visible, mobile drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white p-4 shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none lg:rounded-xl lg:border lg:border-zinc-100
        ${showSidebar ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between lg:hidden mb-3">
          <span className="text-sm font-semibold text-zinc-900">Conversas</span>
          <button onClick={() => setShowSidebar(false)} className="p-1 rounded-lg hover:bg-zinc-100 cursor-pointer">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        {loadingConversations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={loadConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
          />
        )}
      </div>

      {/* Area do chat */}
      <div className="flex flex-1 flex-col rounded-xl border border-zinc-100 bg-white shadow-sm min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 lg:px-6 py-3 lg:py-4">
          <button
            onClick={() => setShowSidebar(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden cursor-pointer"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-amber-500">
            <Brain className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Mentor de Trading</h2>
            <p className="hidden sm:block text-xs text-zinc-500">
              PNL, Oliver Velez, Psicologia de Mercado
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-amber-50">
                <Brain className="h-7 w-7 lg:h-8 lg:w-8 text-amber-500" />
              </div>
              <h3 className="mt-4 text-base lg:text-lg font-semibold text-zinc-900">
                Seu Mentor de Trading
              </h3>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                Pergunte sobre setups, psicologia, gestão de risco, análise dos seus trades,
                ou qualquer dúvida sobre o operacional.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "Bom dia",
                  "Análise meus trades recentes",
                  "Fechei o dia, review pós-mercado",
                  "Como estou evoluindo este mês?",
                  "Estou em tilt, me ajuda",
                  "Quais setups usar em dia lateral?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-50 cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} image={msg.image} />
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl bg-zinc-100 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-zinc-100 px-4 lg:px-6 py-3 lg:py-4">
          <ChatInput onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
