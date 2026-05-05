import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const image = await prisma.replayImage.findUnique({
    where: { id },
    include: { replay: { select: { userId: true } } },
  });

  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (image.replay.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await del(image.path);
  await prisma.replayImage.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
