export const dynamic = "force-dynamic";

import { getReplays } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";
import { NewReplayForm } from "@/components/replays/NewReplayForm";
import { ReplayCard } from "@/components/replays/ReplayCard";

const moodLabels: Record<string, { label: string; color: string }> = {
  OTIMISTA: { label: "Otimista", color: "bg-emerald-50 text-emerald-700" },
  NEUTRO: { label: "Neutro", color: "bg-zinc-100 text-zinc-600" },
  FRUSTRADO: { label: "Frustrado", color: "bg-rose-50 text-rose-700" },
  DISCIPLINADO: { label: "Disciplinado", color: "bg-blue-50 text-blue-700" },
  ANSIOSO: { label: "Ansioso", color: "bg-amber-50 text-amber-700" },
};

export default async function ReplaysPage() {
  const replays = await getReplays();

  return (
    <div className="space-y-8">
      <NewReplayForm />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          Replays Anteriores
        </h3>

        {replays.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <PlayCircle className="h-12 w-12 text-zinc-200 mb-4" />
              <p className="text-sm text-zinc-500">Nenhum replay registrado</p>
              <p className="text-xs text-zinc-400 mt-1">
                Registre seus estudos de replay para acompanhar a evolução
              </p>
            </CardContent>
          </Card>
        ) : (
          (replays as any[]).map((replay) => (
            <ReplayCard key={replay.id} replay={replay} moodLabels={moodLabels} />
          ))
        )}
      </div>
    </div>
  );
}
