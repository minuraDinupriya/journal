"use client";

import { Bot, Info } from "lucide-react";
import { ChatInterface } from "@/components/ai-coach/chat-interface";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAiCoach } from "@/hooks/use-ai-coach";

export default function AiCoachPage() {
  const { sendMessage } = useAiCoach();

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 space-y-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-full">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Trading Coach</h1>
            <p className="text-muted-foreground">Get personalized feedback on your trading patterns</p>
          </div>
        </div>

        <Alert className="bg-muted/50 text-muted-foreground">
          <Info className="h-4 w-4" />
          <AlertDescription>
            The AI coach analyzes your recent trades and journal entries to provide actionable insights. Make sure you have a Gemini API key configured in Settings.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleQuickAction("Can you analyze my overall trading performance and give me some feedback? Please use my stats.")}>
            Analyze My Performance
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleQuickAction("Based on my recent trades, what are my top 3 weaknesses right now?")}>
            Identify My Weaknesses
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleQuickAction("Can you review my recent journal entries and tell me about my emotional patterns?")}>
            Review My Emotional Patterns
          </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 bg-background border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
}
