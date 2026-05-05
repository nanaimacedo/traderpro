"use client";

import { useRef, useState, useCallback } from "react";
import { Send, ImagePlus, X, Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = textareaRef.current?.value.trim();
    if ((!value && imagePreviews.length === 0) || disabled) return;
    onSend(value || "Analise este gráfico", imagePreviews.length > 0 ? imagePreviews : undefined);
    if (textareaRef.current) textareaRef.current.value = "";
    setImagePreviews([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  // Web Speech API (browser-native STT — zero API cost)
  const speechRecognitionRef = useRef<any>(null);
  const hasWebSpeech = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecording = useCallback(async () => {
    // Prefer Web Speech API (free, real-time) over MediaRecorder → API
    if (hasWebSpeech) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.continuous = true;
        recognition.interimResults = true;

        let finalTranscript = "";

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (textareaRef.current) {
            textareaRef.current.value = (finalTranscript + interim).trim();
          }
        };

        recognition.onerror = () => {
          setRecording(false);
        };

        recognition.onend = () => {
          setRecording(false);
          if (textareaRef.current) {
            textareaRef.current.value = finalTranscript.trim();
            textareaRef.current.focus();
          }
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
        setRecording(true);
        return;
      } catch {
        // Fall through to MediaRecorder
      }
    }

    // Fallback: MediaRecorder → /api/speech
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (blob.size < 1000) return;

        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob);
          const res = await fetch("/api/speech", { method: "POST", body: formData });
          const data = await res.json();
          if (data.text && textareaRef.current) {
            textareaRef.current.value = data.text;
            textareaRef.current.focus();
          }
        } catch { /* silently fail */ }
        setTranscribing(false);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      // mic permission denied
    }
  }, [hasWebSpeech]);

  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    } else {
      mediaRecorderRef.current?.stop();
    }
    setRecording(false);
  }, []);

  const hasMic = typeof navigator !== "undefined" && "mediaDevices" in navigator;

  return (
    <div className="space-y-2">
      {imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((src, i) => (
            <div key={i} className="relative inline-block">
              <img
                src={src}
                alt={`Preview ${i + 1}`}
                className="h-20 rounded-lg border border-zinc-200 dark:border-zinc-700 object-cover"
              />
              <button
                onClick={() => setImagePreviews((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-50 cursor-pointer"
          title="Enviar print do gráfico"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="sr-only"
        />
        <textarea
          ref={textareaRef}
          onPaste={(e) => {
            const images = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
            if (!images.length) return;
            e.preventDefault();
            images.forEach((file) => {
              const reader = new FileReader();
              reader.onload = () => setImagePreviews((prev) => [...prev, reader.result as string]);
              reader.readAsDataURL(file);
            });
          }}
          placeholder={
            transcribing
              ? "Transcrevendo áudio..."
              : recording
              ? "Gravando... clique no botão para parar"
              : imagePreviews.length > 0
              ? "Descreva o que quer analisar..."
              : "Pergunte ao seu mentor..."
          }
          disabled={disabled || recording || transcribing}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 disabled:opacity-50 transition-colors"
        />
        {/* Mic button */}
        {hasMic && (
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={disabled || transcribing}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-50",
              recording
                ? "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950 text-rose-500 animate-pulse"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
            title={recording ? "Parar gravação" : "Gravar áudio"}
          >
            {transcribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : recording ? (
              <Square className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || recording || transcribing}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
