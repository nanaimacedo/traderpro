import { NextResponse } from "next/server";

const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(",").filter(Boolean);
const MODELS = ["gemini-2.5-flash-preview-04-17", "gemini-2.0-flash", "gemini-1.5-flash"];

export async function GET() {
  const results: any[] = [];

  for (const model of MODELS) {
    for (let i = 0; i < GEMINI_KEYS.length; i++) {
      const key = GEMINI_KEYS[i];
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say OK" }] }],
              generationConfig: { maxOutputTokens: 10 },
            }),
          }
        );
        const data = await res.json();
        results.push({
          model,
          key: `key[${i}]`,
          status: res.status,
          ok: res.ok,
          text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? null,
          error: data.error ?? null,
        });
      } catch (e: any) {
        results.push({ model, key: `key[${i}]`, status: 0, ok: false, error: e.message });
      }
    }
  }

  return NextResponse.json({ keys: GEMINI_KEYS.length, results });
}
