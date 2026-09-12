import { NextResponse } from "next/server";
import { getTrades } from "@/lib/db/trade-repository";
import { getJournalEntries } from "@/lib/db/journal-repository";
import { calculateAllMetrics } from "@/lib/calculations/trade-metrics";
import { buildSystemPrompt, getAiCoachResponse } from "@/lib/ai/gemini-coach";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const { message, includeStats } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    });

    const apiKey = process.env.GEMINI_API_KEY || user?.geminiApiKey;

    if (!apiKey) {
      return NextResponse.json({ 
        error: "Gemini API key is not configured. Please add it in Settings or set GEMINI_API_KEY in .env.local" 
      }, { status: 400 });
    }

    let systemPrompt = "You are an expert trading psychologist and performance coach. Provide actionable, specific feedback.";

    if (includeStats) {
      const trades = await getTrades({ userId: DEFAULT_USER_ID });
      const journals = await getJournalEntries(DEFAULT_USER_ID);
      
      const metrics = calculateAllMetrics(trades as any);
      systemPrompt = buildSystemPrompt(metrics, trades as any, journals as any);
    }

    const responseText = await getAiCoachResponse(apiKey, message, systemPrompt);

    await prisma.aiCoachMessage.createMany({
      data: [
        {
          userId: DEFAULT_USER_ID,
          role: "user",
          content: message,
        },
        {
          userId: DEFAULT_USER_ID,
          role: "assistant",
          content: responseText,
        }
      ]
    });

    return NextResponse.json({ message: responseText });
  } catch (error) {
    console.error("POST /api/ai-coach error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
