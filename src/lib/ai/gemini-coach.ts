import { GoogleGenerativeAI } from '@google/generative-ai';
import { Trade } from '@/types/trade';
import { DashboardMetrics } from '@/types/metrics';
import { JournalEntry } from '@/types/journal';

export function buildSystemPrompt(metrics: DashboardMetrics, recentTrades: Trade[], journalEntries: JournalEntry[]): string {
  const recentTradesStr = recentTrades.slice(0, 10).map(t => 
    `- ${new Date(t.entryDate).toLocaleDateString()}: ${t.asset} ${t.direction} | PnL: ${t.pnl} | State: ${t.emotionalState}`
  ).join('\n');
  
  const recentJournalStr = journalEntries.slice(0, 5).map(j => 
    `- ${new Date(j.createdAt).toLocaleDateString()}: Mood: ${j.mood} | Content: ${j.content}`
  ).join('\n');

  return `You are an expert trading psychologist and performance coach.

Current Statistics Summary:
- Win Rate: ${metrics.winRate.toFixed(2)}%
- Profit Factor: ${metrics.profitFactor.toFixed(2)}
- Total PnL: ${metrics.totalPnl}
- Average Win: ${metrics.averageWin.toFixed(2)}
- Average Loss: ${metrics.averageLoss.toFixed(2)}
- Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}

Last 10 Trades:
${recentTradesStr || 'No recent trades.'}

Last 5 Journal Entries:
${recentJournalStr || 'No recent journal entries.'}

Instructions:
1. Provide actionable, specific feedback based on the user's data.
2. Analyze correlation between emotional states and performance if possible.
3. Keep responses concise and focused on improving trading psychology and execution.
4. Be empathetic but firm on discipline.
`;
}

const COACH_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
];

export async function getAiCoachResponse(apiKey: string, userMessage: string, systemPrompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = '';

  for (const modelName of COACH_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userMessage }] }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      });

      return result.response.text();
    } catch (error: any) {
      console.warn(`[AI Coach] Model ${modelName} failed: ${error.message}. Trying next model...`);
      lastError = error.message;
    }
  }

  throw new Error(`Failed to get response from Gemini AI: ${lastError}`);
}

export async function generateTradeInsight(apiKey: string, trade: Trade): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = 'You are an expert trading coach. Provide a short, insightful analysis of a single trade.';
  const tradeInfo = `
Trade Details:
- Asset: ${trade.asset} (${trade.assetClass})
- Direction: ${trade.direction}
- Entry Date: ${new Date(trade.entryDate).toLocaleString()}
- PnL: ${trade.pnl}
- Emotion: ${trade.emotionalState}
- Setup/Notes: ${trade.setup} / ${trade.postTradeNotes}
`;

  let lastError = '';
  for (const modelName of COACH_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemInstruction + '\n\n' + tradeInfo }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
        },
      });

      return result.response.text();
    } catch (error: any) {
      console.warn(`[Trade Insight] Model ${modelName} failed: ${error.message}. Trying next model...`);
      lastError = error.message;
    }
  }

  throw new Error(`Failed to generate trade insight: ${lastError}`);
}

