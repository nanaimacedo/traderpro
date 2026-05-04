import { NextRequest, NextResponse } from "next/server";

// PCM L16 (24kHz mono) -> WAV header
function pcmToWav(pcmBase64: string, sampleRate = 24000): Buffer {
  const pcm = Buffer.from(pcmBase64, "base64");
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const headerSize = 44;

  const wav = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);

  // fmt chunk
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);           // chunk size
  wav.writeUInt16LE(1, 20);            // PCM format
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);
  pcm.copy(wav, headerSize);

  return wav;
}

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

    // Clean markdown for natural speech
    const clean = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/---+/g, "")
      .replace(/^[-*]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/[📈📉💡🎯⚠️🔥✅❌🏆⭐🧠💪🙏✨🎖️🛡️]/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 4000);

    for (const key of geminiKeys) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: clean }],
                },
              ],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Charon",
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
        const part = data.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType || "";

        if (!audioData) {
          console.error("Gemini TTS: no audio in response");
          continue;
        }

        // Gemini returns PCM L16 — convert to WAV for browser playback
        if (mimeType.includes("L16") || mimeType.includes("pcm")) {
          const rateMatch = mimeType.match(/rate=(\d+)/);
          const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
          const wavBuffer = pcmToWav(audioData, sampleRate);
          return new Response(wavBuffer as unknown as BodyInit, {
            headers: {
              "Content-Type": "audio/wav",
              "Content-Length": wavBuffer.length.toString(),
            },
          });
        }

        // If already a playable format, return as-is
        const audioBuffer = Buffer.from(audioData, "base64");
        return new Response(audioBuffer as unknown as BodyInit, {
          headers: {
            "Content-Type": mimeType || "audio/mpeg",
            "Content-Length": audioBuffer.length.toString(),
          },
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
