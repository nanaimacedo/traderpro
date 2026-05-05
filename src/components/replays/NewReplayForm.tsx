"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createReplay } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlayCircle, TrendingUp, Minus, TrendingDown, Target, Activity, Upload, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const moods: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "OTIMISTA", label: "Otimista", icon: TrendingUp },
  { value: "NEUTRO", label: "Neutro", icon: Minus },
  { value: "FRUSTRADO", label: "Frustrado", icon: TrendingDown },
  { value: "DISCIPLINADO", label: "Disciplinado", icon: Target },
  { value: "ANSIOSO", label: "Ansioso", icon: Activity },
];

interface StagedFile {
  file: File;
  preview: string;
}

export function NewReplayForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [error, setError] = useState("");
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileStage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newFiles: StagedFile[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setStagedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  function removeStagedFile(index: number) {
    setStagedFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createReplay(formData);

      // Upload de todas as imagens em uma única request
      if (stagedFiles.length > 0) {
        const fd = new FormData();
        fd.append("replayId", result.id);
        stagedFiles.forEach(({ file }) => fd.append("file", file));
        await fetch("/api/upload-replay", { method: "POST", body: fd });
        stagedFiles.forEach((sf) => URL.revokeObjectURL(sf.preview));
      }

      setSelectedMood("");
      setStagedFiles([]);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar replay");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-violet-500" />
          Novo Replay
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data do Replay</label>
              <Input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título</label>
              <Input name="title" placeholder="Ex: Replay WIN — lateralidade com rompimento" required />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Entradas</label>
              <Input type="number" name="entries" min="0" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Gains</label>
              <Input type="number" name="gains" min="0" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Losses</label>
              <Input type="number" name="losses" min="0" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pontos Totais</label>
              <Input type="number" name="points" step="0.5" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Resultado (R$)</label>
              <Input type="number" name="financialResult" step="0.01" placeholder="0,00" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Estado Emocional</label>
            <div className="flex gap-2 flex-wrap">
              {moods.map((mood) => (
                <label key={mood.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="mood"
                    value={mood.value}
                    checked={selectedMood === mood.value}
                    onChange={() => setSelectedMood(mood.value)}
                    className="sr-only peer"
                  />
                  <div className="flex items-center gap-1.5 rounded-full border-2 border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 transition-all peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white dark:peer-checked:border-zinc-100 dark:peer-checked:bg-zinc-100 dark:peer-checked:text-zinc-900">
                    <mood.icon className="h-3.5 w-3.5" />
                    <span>{mood.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Diário do Replay</label>
            <Textarea
              name="content"
              placeholder="Descreva o cenário do replay, setups identificados, decisões tomadas, erros e acertos..."
              rows={5}
              required
            />
          </div>

          {/* Upload de prints */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Prints do Estudo <span className="text-xs font-normal text-zinc-400">(opcional)</span>
            </label>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileStage} className="sr-only" />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-4 text-sm text-zinc-500 dark:text-zinc-400 transition-colors hover:border-violet-400 hover:text-violet-500 dark:hover:border-violet-600 dark:hover:text-violet-400"
            >
              <Upload className="h-4 w-4 shrink-0" />
              Clique para selecionar prints (múltiplos)
            </button>

            {stagedFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stagedFiles.map((sf, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800">
                    <img src={sf.preview} alt={sf.file.name} className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeStagedFile(i)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                      <p className="text-[10px] text-white truncate">{sf.file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? stagedFiles.length > 0 ? "Salvando e enviando prints..." : "Salvando..."
              : `Registrar Replay${stagedFiles.length > 0 ? ` + ${stagedFiles.length} print${stagedFiles.length > 1 ? "s" : ""}` : ""}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
