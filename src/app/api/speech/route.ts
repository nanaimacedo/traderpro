import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: "GROQ_API_KEY não configurada" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as Blob;

    if (!audio) {
      return NextResponse.json({ error: "Áudio não enviado" }, { status: 400 });
    }

    // Send to Groq Whisper (fastest STT available)
    const whisperForm = new FormData();
    whisperForm.append("file", audio, "audio.webm");
    whisperForm.append("model", "whisper-large-v3-turbo");
    whisperForm.append("language", "pt");
    whisperForm.append("response_format", "json");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Whisper error:", res.status, err);
      return NextResponse.json({ error: "Erro na transcrição" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text });
  } catch (err) {
    console.error("Speech API error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
