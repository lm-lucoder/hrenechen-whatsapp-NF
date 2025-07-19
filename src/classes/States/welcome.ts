import State from "../State";
import FluxManager from "../../whatsapp/fluxManager";
import IState from "../../whatsapp/interfaces/state";
import { PersonNumber } from "../../whatsapp/types/types";
import AppError from "../../whatsapp/errors/AppError";

class WelcomeState extends State implements IState {

  constructor(fluxManager: FluxManager) {
    super(fluxManager)
    this.optionsMap = {
      'Gerir um projeto': this.handleOption1,
      'Criar um projeto': this.handleOption2,
      'Listar tudo': this.handleOption3,
    };
  }

  public async render(personNumber: PersonNumber) {
    const message = "*Olá, vamos gerir nossas atividades? Escolha uma das opções:*"
    await this.fluxManager.client.sendMessage(personNumber, message);
  }

  private handleOption1 = async (personNumber: PersonNumber) => {
    // this.fluxManager.setPersonState(personNumber, "selecionar-projeto").render(personNumber);
  };

  private handleOption2 = async (personNumber: PersonNumber) => {
    // this.fluxManager.setPersonState(personNumber, "projeto-criar").render(personNumber);
  };

  private handleOption3 = async (personNumber: PersonNumber) => {
    /* if (ProjetoManager.getInstance().projetos.length > 0) {
      const message = this.fluxManager.projetoManager.descreverProjetos()
      await this.fluxManager.client.sendMessage(personNumber, message);
      this.render(personNumber)
    } else {
      await this.fluxManager.client.sendMessage(personNumber, "Ainda não temos nenhum projeto ativo.")
      this.render(personNumber)
    } */
  };

  public async handleOption(body: string, personNumber: PersonNumber) {

    /* const action = this.getAction(body);
    if (action) {
      action(personNumber);
    } else {
      const message = 'Opção inválida. Por favor, escolha uma das opções disponíveis.';
      await this.fluxManager.client.sendMessage(personNumber, message);
    } */
  }
}

export default WelcomeState;
