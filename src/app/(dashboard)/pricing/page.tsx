"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Check,
  X,
  Loader2,
  Zap,
  BarChart3,
  Brain,
  Download,
  FileText,
  Trophy,
  Shield,
} from "lucide-react";

const FEATURES = [
  { name: "Trades por dia", free: "2", pro: "10", icon: Zap },
  { name: "Mentor IA (mensagens/dia)", free: "5", pro: "Ilimitado", icon: Brain },
  { name: "Analytics avancado", free: false, pro: true, icon: BarChart3 },
  { name: "Exportar CSV/Excel", free: false, pro: true, icon: Download },
  { name: "Relatorio PDF semanal", free: false, pro: true, icon: FileText },
  { name: "Leaderboard", free: false, pro: true, icon: Trophy },
  { name: "Circuit breaker", free: false, pro: true, icon: Shield },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Escolha seu plano
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Comece gratis. Upgrade quando estiver pronto pra evoluir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <Card className="relative">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Free</h2>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">R$ 0</span>
                <span className="text-sm text-zinc-500">/mes</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Para sempre</p>
            </div>

            <div className="space-y-3">
              {FEATURES.map((f) => (
                <div key={f.name} className="flex items-center gap-3 text-sm">
                  {f.free === false ? (
                    <X className="h-4 w-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                  ) : (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  <span className="text-zinc-600 dark:text-zinc-400">{f.name}</span>
                  {typeof f.free === "string" && (
                    <span className="ml-auto text-xs font-mono text-zinc-400">{f.free}</span>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" disabled>
              Plano atual
            </Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="relative border-emerald-500/50 shadow-emerald-500/10 shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              <Crown className="h-3 w-3" />
              POPULAR
            </span>
          </div>

          <CardContent className="pt-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Pro</h2>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-emerald-600">R$ 49</span>
                <span className="text-sm text-zinc-500">,90/mes</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">7 dias gratis de trial</p>
            </div>

            <div className="space-y-3">
              {FEATURES.map((f) => (
                <div key={f.name} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">{f.name}</span>
                  {typeof f.pro === "string" && (
                    <span className="ml-auto text-xs font-mono text-emerald-600 font-bold">{f.pro}</span>
                  )}
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Comecar trial gratis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
        Cancele a qualquer momento. Sem multa. Pagamento seguro via Stripe.
      </p>
    </div>
  );
}
