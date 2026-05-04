"use client";

import { createTrade } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SETUP_TAGS, GENERIC_SETUPS } from "@/lib/methodology-plugins";
import { cn } from "@/lib/utils";

export default function NewTradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [methodology, setMethodology] = useState("oliver-velez");
  const [selectedSetup, setSelectedSetup] = useState("");

  useEffect(() => {
    fetch("/api/profile/check")
      .then((r) => r.json())
      .then((d) => { if (d.profile?.methodology) setMethodology(d.profile.methodology); })
      .catch(() => {});
  }, []);

  const setupOptions = [...(SETUP_TAGS[methodology] || []), ...GENERIC_SETUPS];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createTrade(formData);
    setLoading(false);
    router.push("/trades");
  }

  return (
    <div className="max-w-2xl mx-auto px-0">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
                <Input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Horário</label>
                <Input type="time" name="time" required defaultValue="09:00" />
              </div>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Direção</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative flex cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    value="COMPRA"
                    defaultChecked
                    className="peer sr-only"
                  />
                  <div className="flex w-full items-center justify-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-950 peer-checked:text-emerald-700 dark:peer-checked:text-emerald-400">
                    COMPRA
                  </div>
                </label>
                <label className="relative flex cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    value="VENDA"
                    className="peer sr-only"
                  />
                  <div className="flex w-full items-center justify-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-rose-500 peer-checked:bg-rose-50 dark:peer-checked:bg-rose-950 peer-checked:text-rose-700 dark:peer-checked:text-rose-400">
                    VENDA
                  </div>
                </label>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Preço Entrada</label>
                <Input
                  type="number"
                  name="entryPrice"
                  placeholder="Ex: 128500"
                  step="5"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Preço Saída</label>
                <Input
                  type="number"
                  name="exitPrice"
                  placeholder="Ex: 128650"
                  step="5"
                  required
                />
              </div>
            </div>

            {/* Contracts and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contratos</label>
                <Input
                  type="number"
                  name="contracts"
                  min="1"
                  defaultValue="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Duração (min)</label>
                <Input
                  type="number"
                  name="durationMinutes"
                  placeholder="Opcional"
                  min="0"
                />
              </div>
            </div>

            {/* Setup Tag */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Setup utilizado</label>
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
                    {s.value} — {s.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Taguear o setup ajuda a descobrir quais padrões te dão mais dinheiro.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Observações</label>
              <Textarea
                name="notes"
                placeholder="Emocional, observações sobre a entrada..."
                rows={3}
              />
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-4">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Ativo
              </p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">WIN - Mini Índice</p>
              <p className="text-xs text-zinc-400 mt-1">
                1 ponto = R$ 0,20 por contrato
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Salvando..." : "Registrar Operação"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
