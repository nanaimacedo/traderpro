import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const replayId = formData.get("replayId") as string;

  const files = formData.getAll("file") as File[];
  if (!files.length) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const results = [];

  for (const file of files) {
    const uniqueName = `replays/${replayId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const blob = await put(uniqueName, file, { access: "public" });

    const image = await prisma.replayImage.create({
      data: {
        filename: uniqueName,
        originalName: file.name,
        path: blob.url,
        replayId,
      },
    });

    results.push(image);
  }

  return NextResponse.json(results.length === 1 ? results[0] : results);
}
