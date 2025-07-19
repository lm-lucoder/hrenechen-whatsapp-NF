import { IAIClient, SendMessageParams } from '../interfaces/ai-client';
export default class AIClient implements IAIClient {
  protected static instance: any;

  protected constructor() { }

  public static getInstance(): AIClient {
    if (!AIClient.instance) {
      AIClient.instance = new AIClient();
    }
    return AIClient.instance;
  }

  public async getPrompt(promptName: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const promptsDir = path.resolve(__dirname, '../prompts');
    const filePath = path.join(promptsDir, promptName);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (err) {
      console.error(`Erro ao ler o prompt '${promptName}':`, err);
      return '';
    }
  }

  public async sendMessage(params: SendMessageParams): Promise<string> {
    throw new Error('Método sendMessage deve ser implementado pela subclasse.');
  }
}