"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  User,
  BarChart3,
  Target,
  BookOpen,
  Heart,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

const STEPS = [
  { icon: User, title: "Quem e voce?", description: "Seu nome e como o mentor deve te chamar" },
  { icon: BarChart3, title: "Ativo e Profissao", description: "O que voce opera e o que faz hoje" },
  { icon: Target, title: "Metas", description: "Sua meta mensal e limite de entradas" },
  { icon: BookOpen, title: "Metodologia", description: "Qual abordagem voce segue no mercado" },
  { icon: Heart, title: "Motivacao", description: "O que te move e sua filosofia de vida" },
];

const METHODOLOGIES = [
  { value: "oliver-velez", label: "Oliver Velez" },
  { value: "ict", label: "ICT (Inner Circle Trader)" },
  { value: "smc", label: "SMC (Smart Money Concepts)" },
  { value: "price-action", label: "Price Action" },
  { value: "wyckoff", label: "Wyckoff" },
  { value: "custom", label: "Personalizada" },
];

interface FormData {
  name: string;
  nickname: string;
  asset: string;
  currentJob: string;
  monthlyGoal: string;
  maxEntries: string;
  methodology: string;
  philosophy: string;
  motivation: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "",
    nickname: "",
    asset: "WIN",
    currentJob: "",
    monthlyGoal: "4400",
    maxEntries: "4",
    methodology: "oliver-velez",
    philosophy: "",
    motivation: "",
  });

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canAdvance(): boolean {
    if (step === 0) return form.name.trim().length >= 2;
    if (step === 1) return !!form.asset;
    if (step === 2) return parseFloat(form.monthlyGoal) > 0 && parseInt(form.maxEntries) > 0;
    if (step === 3) return !!form.methodology;
    return true;
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/mentor");
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setSaving(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Passo {step + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                  i === step
                    ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/25"
                    : i < step
                    ? "bg-emerald-500/20 text-emerald-500"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            );
          })}
        </div>

        {/* Card */}
        <Card className="overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500">
                <StepIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {STEPS[step].title}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {STEPS[step].description}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="pt-6 pb-6">
            {/* Step 1: Name + Nickname */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Seu nome
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Ex: Jonatas"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Apelido para motivacao
                  </label>
                  <Input
                    value={form.nickname}
                    onChange={(e) => update("nickname", e.target.value)}
                    placeholder="Ex: guerreiro, campeao, mestre..."
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Como o mentor deve te chamar em momentos de motivacao. Opcional.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Asset + Job */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Ativo principal
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {["WIN", "WDO"].map((asset) => (
                      <label key={asset} className="relative flex cursor-pointer">
                        <input
                          type="radio"
                          name="asset"
                          value={asset}
                          checked={form.asset === asset}
                          onChange={() => update("asset", asset)}
                          className="peer sr-only"
                        />
                        <div className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-950 peer-checked:text-emerald-700 dark:peer-checked:text-emerald-400">
                          <span className="text-lg font-bold">{asset}</span>
                          <span className="text-xs mt-1 opacity-70">
                            {asset === "WIN" ? "Mini Indice" : "Mini Dolar"}
                          </span>
                          <span className="text-xs mt-0.5 opacity-50">
                            1pt = R$ {asset === "WIN" ? "0,20" : "10,00"}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Profissao atual
                  </label>
                  <Input
                    value={form.currentJob}
                    onChange={(e) => update("currentJob", e.target.value)}
                    placeholder="Ex: Engenheiro, Designer, Trader full-time..."
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Ajuda o mentor a entender seu contexto. Opcional.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Monthly Goal + Max Entries */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Meta mensal (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                      R$
                    </span>
                    <Input
                      type="number"
                      value={form.monthlyGoal}
                      onChange={(e) => update("monthlyGoal", e.target.value)}
                      className="pl-10"
                      min="0"
                      step="100"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Quanto voce quer lucrar por mes. Seja realista.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Maximo de entradas por dia
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["2", "3", "4", "5"].map((n) => (
                      <label key={n} className="relative flex cursor-pointer">
                        <input
                          type="radio"
                          name="maxEntries"
                          value={n}
                          checked={form.maxEntries === n}
                          onChange={() => update("maxEntries", n)}
                          className="peer sr-only"
                        />
                        <div className="flex w-full items-center justify-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-950 peer-checked:text-emerald-700 dark:peer-checked:text-emerald-400">
                          {n}
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Limite disciplinado de operacoes por dia.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Methodology */}
            {step === 3 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Metodologia de operacao
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {METHODOLOGIES.map((m) => (
                    <label key={m.value} className="relative flex cursor-pointer">
                      <input
                        type="radio"
                        name="methodology"
                        value={m.value}
                        checked={form.methodology === m.value}
                        onChange={() => update("methodology", m.value)}
                        className="peer sr-only"
                      />
                      <div className="flex w-full items-center rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-950 peer-checked:text-emerald-700 dark:peer-checked:text-emerald-400">
                        <BookOpen className="w-4 h-4 mr-3 opacity-60" />
                        {m.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Philosophy + Motivation */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Sua filosofia de vida
                  </label>
                  <Input
                    value={form.philosophy}
                    onChange={(e) => update("philosophy", e.target.value)}
                    placeholder="Ex: Crista, Estoicismo, PNL, Flow..."
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    O mentor vai adaptar a linguagem ao seu estilo. Opcional.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    O que te move?
                  </label>
                  <Textarea
                    value={form.motivation}
                    onChange={(e) => update("motivation", e.target.value)}
                    placeholder="Ex: Quero dar uma vida melhor pra minha familia. Busco liberdade financeira para viver dos trades..."
                    rows={4}
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Por que voce faz trade? O que te faz levantar cedo? Isso ajuda o mentor a te motivar de verdade.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                variant="success"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                className="gap-1.5"
              >
                Proximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={handleFinish}
                disabled={saving || !form.name.trim()}
                className="gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Comecar jornada
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Welcome message on first step */}
        {step === 0 && (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
            Configure seu perfil para que o mentor te conheca melhor e possa te guiar de forma personalizada.
          </p>
        )}
      </div>
    </div>
  );
}
