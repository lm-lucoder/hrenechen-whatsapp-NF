export interface SendMessageParams {
  messages: any[];
  model?: string;
}

export interface IAIClient {
  sendMessage(params: SendMessageParams): Promise<string>;
  // Adicione outros métodos que devem ser integrados por todos os AIClients
}
