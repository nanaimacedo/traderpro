import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ profile: null }, { status: 401 });

    const profile = await prisma.traderProfile.findUnique({
      where: { userId: session.userId },
    });
    return NextResponse.json({ profile: profile ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();

    const data = {
      name: body.name,
      nickname: body.nickname || null,
      asset: body.asset || "WIN",
      pointValue: body.asset === "WDO" ? 10 : 0.2,
      currentJob: body.currentJob || null,
      monthlyGoal: body.monthlyGoal ? parseFloat(body.monthlyGoal) : 4400,
      maxEntries: body.maxEntries ? parseInt(body.maxEntries) : 4,
      dailyLossLimit: body.dailyLossLimit ? parseFloat(body.dailyLossLimit) : null,
      methodology: body.methodology || "oliver-velez",
      philosophy: body.philosophy || null,
      motivation: body.motivation || null,
      onboarded: true,
    };

    const profile = await prisma.traderProfile.upsert({
      where: { userId: session.userId },
      update: data,
      create: { ...data, userId: session.userId },
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
