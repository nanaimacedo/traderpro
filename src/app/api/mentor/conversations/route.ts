import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const conversations = await prisma.mentorConversation.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(conversations);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  await prisma.mentorConversation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
