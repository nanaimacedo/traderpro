import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (geminiKeys.length === 0) {
    return NextResponse.json({ error: "GEMINI_API_KEY nao configurada" }, { status: 500 });
  }

  try {
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Texto vazio" }, { status: 400 });
    }

    // Clean markdown for speech
    const clean = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/---+/g, "")
      .replace(/^[-*]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/[📈📉💡🎯⚠️🔥✅❌🏆⭐🧠💪🙏✨🎖️]/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 4000); // Gemini TTS limit

    // Try each key until one works
    for (const key of geminiKeys) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Leia o seguinte texto em portugues brasileiro, com tom de mentor confiante e acolhedor. Fale naturalmente, como um ser humano real conversando. Nao adicione nada alem do texto:\n\n${clean}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Charon", // Male, deep, warm
                    },
                  },
                },
              },
            }),
          }
        );

        if (!res.ok) {
          if (res.status === 429) continue;
          const err = await res.text();
          console.error(`Gemini TTS error ${res.status}:`, err.slice(0, 200));
          continue;
        }

        const data = await res.json();
        const audioData =
          data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioData) {
          console.error("Gemini TTS: no audio in response");
          continue;
        }

        const mimeType =
          data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType ||
          "audio/mp3";

        // Return base64 audio
        return NextResponse.json({
          audio: audioData,
          mimeType,
        });
      } catch (e) {
        console.error("Gemini TTS key error:", e);
        continue;
      }
    }

    return NextResponse.json(
      { error: "TTS indisponivel — todas as keys falharam" },
      { status: 503 }
    );
  } catch (err) {
    console.error("TTS error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
