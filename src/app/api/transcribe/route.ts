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

    const cleanMime = (mimeType || "audio/webm").split(";")[0];

    // Use gemini-3.6-flash on the v1beta endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Transcribe the spoken words in this audio exactly as said. Output ONLY the plain transcribed text without markdown, quotes, explanations, or commentary. If there is no discernible speech or only silence, return empty text."
              },
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: audioData
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error?.message || `API error: ${response.status}`;
      console.error("Gemini Transcription API error:", errorData);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    
    // Extract actual text (ignoring internal thinking/reasoning blocks)
    const textParts = parts
      .filter((p: any) => p.text && !p.thought)
      .map((p: any) => p.text);

    let rawText = textParts.length > 0 ? textParts.join(" ") : (parts[0]?.text || "");
    let cleanedText = rawText.trim();

    // Check if the model gave a meta-reply about silence or missing speech
    const lower = cleanedText.toLowerCase();
    if (
      lower.includes("no speech") ||
      lower.includes("no audio") ||
      lower.includes("silent") ||
      lower.includes("cannot transcribe") ||
      lower === "none"
    ) {
      cleanedText = "";
    }

    return NextResponse.json({ text: cleanedText });
  } catch (error: any) {
    console.error("Transcription route error:", error);
    return NextResponse.json({ error: error.message || "Failed to transcribe audio" }, { status: 500 });
  }
}
