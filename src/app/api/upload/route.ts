import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const diaryEntryId = formData.get("diaryEntryId") as string;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const uniqueName = `diary/${diaryEntryId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const blob = await put(uniqueName, file, { access: "public" });

  const image = await prisma.diaryImage.create({
    data: {
      filename: uniqueName,
      originalName: file.name,
      path: blob.url,
      diaryEntryId,
    },
  });

  return NextResponse.json(image);
}
