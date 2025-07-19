export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  temperature?: number;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    }
  }>;
}
