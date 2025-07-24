import State from "../State";
import FluxManager from "../../whatsapp/fluxManager";
import IState, { IHandleMessageProps, IRenderProps } from "../../whatsapp/interfaces/state";
import { PersonNumber } from "../../whatsapp/types/types";
import OpenRouterClient from "../AIClients/OpenRouterClient";

class WelcomeState extends State implements IState {

  constructor(fluxManager: FluxManager) {
    super(fluxManager)
  }

  public async render({ personNumber, message }: IRenderProps): Promise<void> {
    this.handleMessage({ message, personNumber });
  }


  public async handleMessage({ message, personNumber }: IHandleMessageProps) {
    const openRouterClient = OpenRouterClient.getInstance();
    const rawPrompt = await openRouterClient.getPrompt('welcome.txt');
    const prompt = rawPrompt
      .replace("{{CHAT_MESSAGES}}", JSON.stringify(this.fluxManager.getChatMessages(personNumber, 10)));
    const openRouterResult = await openRouterClient.sendMessage({ messages: [{ role: 'user', content: prompt }] });
    const treatedOpenRouterMessage = openRouterResult
      .replace("```json", "")
      .replace("```", "")
      .replace(/\\n/g, "\n")
      .replace(/\\\"/g, "\"")
      .replace(/\\'/g, "'")
      .replaceAll("\n", "");
    try {
      const data = JSON.parse(treatedOpenRouterMessage);
      if (data.intencao == "emitir_nota_fiscal") {
        return this.fluxManager.setPersonState(personNumber, "emitir_nf").handleMessage({
          message,
          personNumber,
          systemVars: data
        });
      }
      this.fluxManager.sendMessage({
        personNumber,
        message: data.proxima_mensagem || "Obrigado por entrar em contato! Como posso ajudar?",
      });
    } catch (error) {
      console.error("Erro ao processar a mensagem da IA:", error);
      //await this.fluxManager.client.sendMessage({ personNumber, message: "Algo deu errado, a IA não conseguiu processar sua solicitação." });
    }
  }
}

export default WelcomeState;
