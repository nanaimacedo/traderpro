"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReplay } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlayCircle, TrendingUp, Minus, TrendingDown, Target, Activity, Upload, X, CheckCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const moods: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "OTIMISTA", label: "Otimista", icon: TrendingUp },
  { value: "NEUTRO", label: "Neutro", icon: Minus },
  { value: "FRUSTRADO", label: "Frustrado", icon: TrendingDown },
  { value: "DISCIPLINADO", label: "Disciplinado", icon: Target },
  { value: "ANSIOSO", label: "Ansioso", icon: Activity },
];

interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  path: string;
}

export function NewReplayForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [error, setError] = useState("");
  const [savedReplayId, setSavedReplayId] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createReplay(formData);
      setSavedReplayId(result.id);
      setSelectedMood("");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar replay");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!savedReplayId || !e.target.files) return;
    setUploading(true);

    for (const file of Array.from(e.target.files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("replayId", savedReplayId);

      const res = await fetch("/api/upload-replay", { method: "POST", body: fd });
      if (res.ok) {
        const img = await res.json();
        setImages((prev) => [...prev, img]);
      }
    }

    setUploading(false);
    e.target.value = "";
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  function handleDone() {
    setSavedReplayId(null);
    setImages([]);
    router.refresh();
  }

  // Estado pós-save: uploader de imagens
  if (savedReplayId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            Replay salvo! Adicione screenshots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="sr-only"
            />
            <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-4 transition-colors hover:border-violet-400 dark:hover:border-violet-600">
              <Upload className="h-5 w-5 text-zinc-400" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {uploading ? "Enviando..." : "Clique para selecionar prints do estudo"}
              </span>
            </div>
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800">
                  <img src={img.path} alt={img.originalName} className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <p className="text-[10px] text-white truncate">{img.originalName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleDone} className="flex-1">
              {images.length > 0 ? `Concluído (${images.length} print${images.length > 1 ? "s" : ""})` : "Concluído sem prints"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
              <Input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título</label>
              <Input name="title" placeholder="Ex: Replay WIN — lateralidade com rompimento" required />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Registrar Replay"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
