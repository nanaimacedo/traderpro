import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file || !file.size) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.type.split("/")[1] || "png";
  const name = `trades/${session.userId}/${Date.now()}.${ext}`;
  const blob = await put(name, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
