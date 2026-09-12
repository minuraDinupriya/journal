export interface AiCoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiCoachRequest {
  message: string;
  includeStats?: boolean;
}

export interface AiCoachResponse {
  message: string;
  insights?: string[];
}
