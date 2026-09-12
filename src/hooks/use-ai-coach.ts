"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface AiCoachMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export function useAiCoach() {
  const [messages, setMessages] = useState<AiCoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, includeStats: boolean = false) => {
    const userMessage: AiCoachMessage = {
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, includeStats }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message to AI coach');
      }

      const data = await response.json();
      
      const assistantMessage: AiCoachMessage = {
        role: 'assistant',
        content: data.reply || data.content,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage = err.message || 'Error communicating with AI Coach';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  };
}
