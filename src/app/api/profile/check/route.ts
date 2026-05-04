import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ onboarded: false, profile: null });

    const profile = await prisma.traderProfile.findUnique({
      where: { userId: session.userId },
    });
    return NextResponse.json({
      onboarded: profile?.onboarded ?? false,
      profile: profile ?? null,
    });
  } catch {
    return NextResponse.json({ onboarded: false, profile: null }, { status: 500 });
  }
}
