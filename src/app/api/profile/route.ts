import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.traderProfile.findFirst();
    if (!profile) {
      return NextResponse.json({ profile: null });
    }
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const existing = await prisma.traderProfile.findFirst();

    const data = {
      name: body.name,
      nickname: body.nickname || null,
      asset: body.asset || "WIN",
      pointValue: body.asset === "WDO" ? 10 : 0.2,
      currentJob: body.currentJob || null,
      monthlyGoal: body.monthlyGoal ? parseFloat(body.monthlyGoal) : 4400,
      maxEntries: body.maxEntries ? parseInt(body.maxEntries) : 4,
      methodology: body.methodology || "oliver-velez",
      philosophy: body.philosophy || null,
      motivation: body.motivation || null,
      onboarded: true,
    };

    let profile;
    if (existing) {
      profile = await prisma.traderProfile.update({
        where: { id: existing.id },
        data,
      });
    } else {
      profile = await prisma.traderProfile.create({ data });
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
