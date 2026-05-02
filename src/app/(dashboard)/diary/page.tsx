export const dynamic = "force-dynamic";

import { getDiaryEntries } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { NewDiaryForm } from "@/components/diary/NewDiaryForm";
import { DiaryEntryCard } from "@/components/diary/DiaryEntryCard";

const moodLabels: Record<string, { label: string; color: string }> = {
  OTIMISTA: { label: "Otimista", color: "bg-emerald-50 text-emerald-700" },
  NEUTRO: { label: "Neutro", color: "bg-zinc-100 text-zinc-600" },
  FRUSTRADO: { label: "Frustrado", color: "bg-rose-50 text-rose-700" },
  DISCIPLINADO: { label: "Disciplinado", color: "bg-blue-50 text-blue-700" },
  ANSIOSO: { label: "Ansioso", color: "bg-amber-50 text-amber-700" },
};

export default async function DiaryPage() {
  const entries = await getDiaryEntries();

  return (
    <div className="space-y-8">
      <NewDiaryForm />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          Entradas Anteriores
        </h3>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-12 w-12 text-zinc-200 mb-4" />
              <p className="text-sm text-zinc-500">Nenhuma entrada no diario</p>
              <p className="text-xs text-zinc-400 mt-1">
                Registre suas analises e aprendizados
              </p>
            </CardContent>
          </Card>
        ) : (
          (entries as any[]).map((entry) => (
            <DiaryEntryCard key={entry.id} entry={entry} moodLabels={moodLabels} />
          ))
        )}
      </div>
    </div>
  );
}
