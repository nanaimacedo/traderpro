"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReplay } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlayCircle, TrendingUp, Minus, TrendingDown, Target, Activity, type LucideIcon } from "lucide-react";

const moods: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "OTIMISTA", label: "Otimista", icon: TrendingUp },
  { value: "NEUTRO", label: "Neutro", icon: Minus },
  { value: "FRUSTRADO", label: "Frustrado", icon: TrendingDown },
  { value: "DISCIPLINADO", label: "Disciplinado", icon: Target },
  { value: "ANSIOSO", label: "Ansioso", icon: Activity },
];

export function NewReplayForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createReplay(formData);
    setLoading(false);
    setSelectedMood("");
    (e.target as HTMLFormElement).reset();
    router.refresh();
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
              <label className="text-sm font-medium text-zinc-700">Data do Replay</label>
              <Input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Título</label>
              <Input name="title" placeholder="Ex: Replay WIN — lateralidade com rompimento" required />
            </div>
          </div>

          {/* Resultados do replay */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Entradas</label>
              <Input type="number" name="entries" min="0" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Gains</label>
              <Input type="number" name="gains" min="0" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Losses</label>
              <Input type="number" name="losses" min="0" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Pontos Totais</label>
              <Input type="number" name="points" step="0.5" defaultValue="0" required />
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
            <label className="text-sm font-medium text-zinc-700">Diário do Replay</label>
            <Textarea
              name="content"
              placeholder="Descreva o cenário do replay, setups identificados, decisões tomadas, erros e acertos..."
              rows={5}
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Registrar Replay"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
