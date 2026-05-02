"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDiaryEntry } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./ImageUpload";
import { BookOpen, TrendingUp, Minus, TrendingDown, Target, Activity, type LucideIcon } from "lucide-react";

const moods: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "OTIMISTA", label: "Otimista", icon: TrendingUp },
  { value: "NEUTRO", label: "Neutro", icon: Minus },
  { value: "FRUSTRADO", label: "Frustrado", icon: TrendingDown },
  { value: "DISCIPLINADO", label: "Disciplinado", icon: Target },
  { value: "ANSIOSO", label: "Ansioso", icon: Activity },
];

export function NewDiaryForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [diaryId, setDiaryId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const entry = await createDiaryEntry(formData);
    setDiaryId(entry.id);
    setShowUpload(true);
    setLoading(false);
  }

  function handleDone() {
    setDiaryId(null);
    setShowUpload(false);
    setSelectedMood("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-zinc-400" />
          Nova Entrada
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showUpload ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Data</label>
                <Input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Título</label>
                <Input name="title" placeholder="Ex: Setup de rompimento no WIN" required />
              </div>
            </div>

            {/* Mood selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Estado Emocional</label>
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
                    <div className="flex items-center gap-1.5 rounded-full border-2 border-zinc-200 px-3 py-1.5 text-sm transition-all peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white">
                      <mood.icon className="h-3.5 w-3.5" />
                      <span>{mood.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Conteúdo</label>
              <Textarea
                name="content"
                placeholder="Descreva o dia de operação, setups utilizados, erros, acertos, emocional..."
                rows={6}
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar e Adicionar Prints"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Entrada salva! Agora você pode adicionar prints do mercado.
            </p>
            <ImageUpload diaryEntryId={diaryId!} />
            <Button onClick={handleDone} variant="outline">
              Concluir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
