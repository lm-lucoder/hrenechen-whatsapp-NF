import { IAIClient, SendMessageParams } from '../interfaces/ai-client';

export default class AIClient implements IAIClient {
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