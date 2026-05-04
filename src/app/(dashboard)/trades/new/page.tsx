"use client";

import { createTradeWithDiary } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SETUP_TAGS, GENERIC_SETUPS } from "@/lib/methodology-plugins";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Target, Activity } from "lucide-react";

const moods = [
  { value: "OTIMISTA", label: "Otimista", icon: TrendingUp },
  { value: "DISCIPLINADO", label: "Disciplinado", icon: Target },
  { value: "NEUTRO", label: "Neutro", icon: Minus },
  { value: "FRUSTRADO", label: "Frustrado", icon: TrendingDown },
  { value: "ANSIOSO", label: "Ansioso", icon: Activity },
];

export default function NewTradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [methodology, setMethodology] = useState("oliver-velez");
  const [selectedSetup, setSelectedSetup] = useState("");
  const [selectedMood, setSelectedMood] = useState("");

  useEffect(() => {
    fetch("/api/profile/check")
      .then((r) => r.json())
      .then((d) => { if (d.profile?.methodology) setMethodology(d.profile.methodology); })
      .catch(() => {});
  }, []);

  const setupOptions = [...(SETUP_TAGS[methodology] || []), ...GENERIC_SETUPS];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createTradeWithDiary(formData);
      router.push("/trades");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-0">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
                <Input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Horário</label>
                <Input type="time" name="time" required defaultValue={new Date().toTimeString().slice(0, 5)} />
              </div>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Direção</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative flex cursor-pointer">
                  <input type="radio" name="direction" value="COMPRA" defaultChecked className="peer sr-only" />
                  <div className="flex w-full items-center justify-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-950 peer-checked:text-emerald-700 dark:peer-checked:text-emerald-400">
                    COMPRA
                  </div>
                </label>
                <label className="relative flex cursor-pointer">
                  <input type="radio" name="direction" value="VENDA" className="peer sr-only" />
                  <div className="flex w-full items-center justify-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-rose-500 peer-checked:bg-rose-50 dark:peer-checked:bg-rose-950 peer-checked:text-rose-700 dark:peer-checked:text-rose-400">
                    VENDA
                  </div>
                </label>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Entrada</label>
                <Input type="number" name="entryPrice" placeholder="Ex: 128500" step="5" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Saída</label>
                <Input type="number" name="exitPrice" placeholder="Ex: 128650" step="5" required />
              </div>
            </div>

            {/* Contracts and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contratos</label>
                <Input type="number" name="contracts" min="1" defaultValue="1" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Duração (min)</label>
                <Input type="number" name="durationMinutes" placeholder="Opcional" min="0" />
              </div>
            </div>

            {/* Setup Tag */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Setup</label>
              <input type="hidden" name="setup" value={selectedSetup} />
              <div className="flex flex-wrap gap-1.5">
                {setupOptions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedSetup(selectedSetup === s.value ? "" : s.value)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                      selectedSetup === s.value
                        ? "bg-violet-500 text-white border-violet-500"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700"
                    )}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Diário comentado — Gemini lê os dados direto da aba Nova Operação */}
            {/* <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                Como você está? <span className="normal-case font-normal text-zinc-400">(opcional — salva no diário)</span>
              </p>
              <div className="flex gap-2 flex-wrap mb-3">
                <input type="hidden" name="diaryMood" value={selectedMood} />
                {moods.map((mood) => (
                  <button key={mood.value} type="button"
                    onClick={() => setSelectedMood(selectedMood === mood.value ? "" : mood.value)}
                    className={cn("flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                      selectedMood === mood.value
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
                    )}>
                    <mood.icon className="h-3 w-3" />
                    {mood.label}
                  </button>
                ))}
              </div>
              <Textarea name="diaryNote" placeholder="O que rolou nessa operação? Observações rápidas..." rows={2} className="text-sm" />
            </div> */}

            {error && (
              <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Salvando..." : "Registrar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
