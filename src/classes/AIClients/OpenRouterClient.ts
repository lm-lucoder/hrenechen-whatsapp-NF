import { SendMessageParams } from '../../interfaces/ai-client';
import { OpenRouterMessage, OpenRouterRequest, OpenRouterResponse } from '../../interfaces/openrouter';
import AIClient from '../AIClient';


class OpenRouterClient extends AIClient {
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey: string;

  private constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  public static getInstance(): OpenRouterClient {
    if (!OpenRouterClient.instance) {
      (OpenRouterClient.prototype as any).instance = new OpenRouterClient(process.env.OPENROUTER_API_KEY || '');
    }
    return (OpenRouterClient.prototype as any).instance;
  }

  public async sendMessage(params: SendMessageParams): Promise<string> {
    const model = params.model || 'deepseek/deepseek-chat:free';
    const payload: OpenRouterRequest = { model, messages: params.messages };
    const fetch = (await import('node-fetch')).default;
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }
      const data: OpenRouterResponse = await response.json();
      // Retorna o conteúdo da primeira escolha
      return data.choices[0]?.message?.content || '';
    } catch (err) {
      console.error('Erro ao interagir com OpenRouter:', err);
      return '';
    }
  }
}

export default OpenRouterClient;
