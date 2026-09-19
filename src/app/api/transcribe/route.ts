import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { audioData, mimeType } = await req.json();

    if (!audioData) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    // Use the v1beta endpoint which supports AQ. style API keys from AI Studio
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Please transcribe the following audio accurately. Return ONLY the transcribed text with no extra formatting, commentary, or punctuation beyond what was spoken. If there is no speech, return an empty string."
              },
              {
                inlineData: {
                  mimeType: mimeType || "audio/webm",
                  data: audioData
                }
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error?.message || `API error: ${response.status}`;
      console.error("Gemini API error:", errorData);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message || "Failed to transcribe audio" }, { status: 500 });
  }
}
