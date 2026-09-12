"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAiCoach } from "@/hooks/useAiCoach";
import { cn } from "@/lib/utils";

export function ChatInterface() {
  const { messages, sendMessage, isLoading } = useAiCoach();
  const [input, setInput] = useState("");
  const [includeStats, setIncludeStats] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input, includeStats);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown formatting for bold and paragraphs
    const paragraphs = content.split('\n\n');
    return paragraphs.map((p, i) => {
      // Split by bold (**text**)
      const parts = p.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-2 last:mb-0 text-sm leading-relaxed">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <ScrollArea className="flex-grow p-4 md:p-6" viewportRef={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
            <Bot className="h-12 w-12 opacity-50" />
            <p>Send a message to start a conversation with your AI trading coach.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex gap-3 max-w-[85%]", 
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-3",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {formatMessage(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted text-foreground flex items-center space-x-2">
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Checkbox 
            id="includeStats" 
            checked={includeStats} 
            onCheckedChange={(c) => setIncludeStats(!!c)} 
          />
          <Label htmlFor="includeStats" className="text-sm font-normal text-muted-foreground cursor-pointer">
            Include my trading stats in this request
          </Label>
        </div>
        <div className="flex gap-2">
          <Textarea 
            placeholder="Ask your coach anything..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button 
            className="h-auto self-stretch w-14" 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
