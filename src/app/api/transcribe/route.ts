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
    const transcriptionPrompt = `You are a high-accuracy, verbatim speech-to-text transcriber specialized in financial trading, charting, and trading psychology journals.

Your task: Transcribe the speaker's voice EXACTLY word-for-word as spoken.

Trading & Market Domain Vocabulary:
- Assets & Symbols: NQ, ES, MNQ, MES, Gold, XAUUSD, EURUSD, GBPUSD, DXY, SPX, Bitcoin, BTC, ETH, US30, Crude Oil, Futures, Forex, Crypto, Stocks.
- Core Concepts: Long, Short, PnL / P&L, Stop Loss (SL), Take Profit (TP), Break Even (BE), Risk-to-Reward (R:R), R-multiple (e.g. 1R, 2R, -1R), Entry price, Exit price, Lot size, Contracts, Slippage, Spread, Commission, Fees.
- Technical Setups: Fair Value Gap (FVG), Inverse FVG, Order Block (OB), Liquidity sweep, Break of Structure (BOS), Change of Character (CHoCH), Range, Breakout, Pullback, Retracement, Bull flag, Bear flag, Wedge, Double top, Double bottom, Higher High (HH), Higher Low (HL), Lower High (LH), Lower Low (LL), VWAP, EMA, SMA, Support, Resistance, Supply, Demand, Wick, Engulfing candle.
- Psychology: FOMO, revenge trading, tilted, hesitant, disciplined, overtrading, patient, confident, anxious.

Rules:
1. Output ONLY the literal transcription of what was said.
2. Do NOT summarize, rewrite, rephrase, or add polite conversation (like "Here is the transcription:").
3. Ensure trading terminology and acronyms (like NQ, SL, TP, FVG, PnL, R:R) are spelled accurately according to the context above.
4. Format numbers, prices, and decimals accurately (e.g., 29450, 4362.50, -1.00R, +$89.50).
5. If the audio is silent or contains only static, output nothing.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: transcriptionPrompt
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
            temperature: 0.0,
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
