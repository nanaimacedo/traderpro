import { NextResponse } from "next/server";
import { listMethodologies } from "@/lib/methodology-plugins";

export async function GET() {
  return NextResponse.json(listMethodologies());
}
