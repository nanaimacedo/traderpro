import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.traderProfile.findFirst();
    return NextResponse.json({
      onboarded: profile?.onboarded ?? false,
      profile: profile ?? null,
    });
  } catch {
    return NextResponse.json({ onboarded: false, profile: null }, { status: 500 });
  }
}
