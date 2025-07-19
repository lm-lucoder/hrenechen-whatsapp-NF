import State from "../State";
import FluxManager from "../../whatsapp/fluxManager";
import IState from "../../whatsapp/interfaces/state";
import { PersonNumber } from "../../whatsapp/types/types";
import OpenRouterClient from "../AIClients/OpenRouterClient";

class WelcomeState extends State implements IState {

  constructor(fluxManager: FluxManager) {
    super(fluxManager)
  }

  public async handleOption(body: string, personNumber: PersonNumber) {
    const openRouterClient = OpenRouterClient.getInstance();
    const rawPrompt = await openRouterClient.getPrompt('welcome.txt');
    const prompt = rawPrompt
      .replace("{{USER_MESSAGE}}", body)
      .replace("{{CHAT_MESSAGES}}", JSON.stringify(this.fluxManager.getChatMessages(personNumber)));
    const message = await openRouterClient.sendMessage({ messages: [{ role: 'user', content: prompt }] });
  }
}

export default WelcomeState;
