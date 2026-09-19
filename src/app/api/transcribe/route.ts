import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { audioData, mimeType } = await req.json();

    if (!audioData) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Please transcribe the following audio accurately. Return ONLY the transcribed text without any markdown formatting, conversational filler, or extra punctuation. If there is no speech, return an empty string.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audioData // This is the base64 string
        }
      }
    ]);

    const text = result.response.text();

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message || "Failed to transcribe audio" }, { status: 500 });
  }
}
