"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  path: string;
}

export function ImageUpload({ diaryEntryId }: { diaryEntryId: string }) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("diaryEntryId", diaryEntryId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const image = await res.json();
        setImages((prev) => [...prev, image]);
      }
    }

    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="sr-only"
          />
          <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700">
            <Upload className="h-4 w-4" />
            {uploading ? "Enviando..." : "Fazer upload de prints"}
          </div>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-zinc-100">
              <img
                src={img.path}
                alt={img.originalName}
                className="w-full h-32 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <p className="text-[10px] text-white truncate">{img.originalName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
