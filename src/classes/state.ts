import FluxManager from "../whatsapp/fluxManager";
import { IMessageClient } from "../whatsapp/interfaces/message-client";
import IState from "../whatsapp/interfaces/state";
import { PersonNumber } from "../whatsapp/types/types";

class State implements IState {
  fluxManager: FluxManager;
  client: IMessageClient;
  protected optionsMap: Record<string | number, (personNumber: PersonNumber) => void>;

  constructor(fluxManager: FluxManager) {
    this.fluxManager = fluxManager;
    this.client = this.fluxManager.client;
  }

  public async render(personNumber: PersonNumber): Promise<void> { console.error("Aviso: Tentativa de renderizar um estado sem método render especificado") }

  public async handleOption(body: string, personNumber: PersonNumber) {
    if (body.toLowerCase().replace(" ", "") == 'cancelar') {
      return await this.cancel(personNumber)
    }
    const action = this.getAction(body);
    if (action) {
      action(personNumber);
    } else {
      const message = 'Opção inválida. Por favor, escolha uma das opções disponíveis.';
      await this.fluxManager.client.sendMessage(personNumber, message);
    }
  }

  public async cancel(personNumber) {
    await this.fluxManager.client.sendMessage(personNumber, "Ok, cancelando a sua ação.")
    this.fluxManager.setPersonState(personNumber, "welcome").render(personNumber)
  }

  public getAction(option: string) {
    const found = this._findMatchingKey(this.optionsMap, option)
    return this.optionsMap[found]
  }

  protected _findMatchingKey(obj: Record<string, any>, searchString: string): string | undefined {
    const normalizedSearch = searchString.toLowerCase().replaceAll(" ", "");

    // Percorre todas as chaves do objeto
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Normaliza a chave atual
        const normalizedKey = key.toLowerCase().replaceAll(" ", "");

        // Compara a chave normalizada com a string normalizada
        if (normalizedKey === normalizedSearch) {
          return key;
        }
      }
    }
  }
}
export default State