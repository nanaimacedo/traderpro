"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Crosshair,
  ArrowUp,
  ArrowDown,
  Shield,
  Undo,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Annotation {
  type: "entry" | "exit" | "stop" | "line";
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  color: string;
  label: string;
}

interface ScreenshotAnnotationProps {
  onSave?: (dataUrl: string) => void;
  initialImage?: string;
}

const TOOLS = [
  { id: "entry", label: "Entrada", icon: ArrowUp, color: "#10b981" },
  { id: "exit", label: "Saida", icon: ArrowDown, color: "#3b82f6" },
  { id: "stop", label: "Stop", icon: Shield, color: "#ef4444" },
  { id: "line", label: "Linha", icon: Crosshair, color: "#a855f7" },
] as const;

type ToolType = typeof TOOLS[number]["id"];

export function ScreenshotAnnotation({ onSave, initialImage }: ScreenshotAnnotationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>("entry");
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);

  const getToolConfig = (type: string) => TOOLS.find(t => t.id === type) || TOOLS[0];

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const ann of annotations) {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = 2;
      ctx.font = "bold 12px sans-serif";

      if (ann.type === "line" && ann.x2 !== undefined && ann.y2 !== undefined) {
        ctx.beginPath();
        ctx.setLineDash([6, 3]);
        ctx.moveTo(ann.x, ann.y);
        ctx.lineTo(ann.x2, ann.y2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Draw marker
        ctx.beginPath();
        ctx.arc(ann.x, ann.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw horizontal line
        ctx.beginPath();
        ctx.setLineDash([4, 2]);
        ctx.moveTo(0, ann.y);
        ctx.lineTo(canvas.width, ann.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw label
        const textWidth = ctx.measureText(ann.label).width;
        ctx.fillStyle = ann.color + "dd";
        ctx.fillRect(ann.x + 10, ann.y - 18, textWidth + 8, 20);
        ctx.fillStyle = "#fff";
        ctx.fillText(ann.label, ann.x + 14, ann.y - 3);
      }
    }
  }, [image, annotations]);

  useEffect(() => { redraw(); }, [redraw]);

  function handleImageLoad(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maxW = 800;
        const scale = Math.min(maxW / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        setImage(img);
        setAnnotations([]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const tool = getToolConfig(activeTool);

    if (activeTool === "line") {
      if (!isDrawingLine) {
        setLineStart({ x, y });
        setIsDrawingLine(true);
      } else if (lineStart) {
        setAnnotations(prev => [...prev, {
          type: "line",
          x: lineStart.x,
          y: lineStart.y,
          x2: x,
          y2: y,
          color: tool.color,
          label: "Linha",
        }]);
        setIsDrawingLine(false);
        setLineStart(null);
      }
    } else {
      setAnnotations(prev => [...prev, {
        type: activeTool,
        x,
        y,
        color: tool.color,
        label: tool.label,
      }]);
    }
  }

  function handleUndo() {
    setAnnotations(prev => prev.slice(0, -1));
    setIsDrawingLine(false);
    setLineStart(null);
  }

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave?.(dataUrl);
  }

  if (!image) {
    return (
      <div
        className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageLoad(file);
          }}
        />
        <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Clique para enviar screenshot do grafico
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Anote entry, exit e stop diretamente na imagem
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setIsDrawingLine(false); setLineStart(null); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTool === tool.id
                  ? "text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
              style={activeTool === tool.id ? { backgroundColor: tool.color } : {}}
            >
              <Icon className="h-3.5 w-3.5" />
              {tool.label}
            </button>
          );
        })}

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={handleUndo} disabled={annotations.length === 0}>
          <Undo className="h-3.5 w-3.5 mr-1" />
          Desfazer
        </Button>

        <Button variant="ghost" size="sm" onClick={() => { setImage(null); setAnnotations([]); }}>
          <X className="h-3.5 w-3.5 mr-1" />
          Limpar
        </Button>

        <Button size="sm" onClick={handleExport} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Download className="h-3.5 w-3.5 mr-1" />
          Salvar
        </Button>
      </div>

      {isDrawingLine && (
        <p className="text-xs text-violet-500 font-medium">Clique no segundo ponto para completar a linha</p>
      )}

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-crosshair"
          style={{ maxHeight: "500px" }}
        />
      </div>

      {annotations.length > 0 && (
        <p className="text-[10px] text-zinc-400">
          {annotations.length} anotacao(oes) — {annotations.filter(a => a.type === "entry").length} entrada, {annotations.filter(a => a.type === "exit").length} saida, {annotations.filter(a => a.type === "stop").length} stop
        </p>
      )}
    </div>
  );
}
