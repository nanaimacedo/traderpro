import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ onboarded: false, profile: null });

    const [profile, user] = await Promise.all([
      prisma.traderProfile.findUnique({ where: { userId: session.userId } }),
      prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } }),
    ]);
    return NextResponse.json({
      onboarded: profile?.onboarded ?? false,
      profile: profile ?? null,
      role: user?.role ?? "trader",
    });
  } catch {
    return NextResponse.json({ onboarded: false, profile: null }, { status: 500 });
  }
}
