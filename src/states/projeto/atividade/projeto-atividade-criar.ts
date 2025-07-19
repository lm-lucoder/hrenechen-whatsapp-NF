import { Atividade } from "../../../services/atividade";
import State from "../../../classes/state";
import IState from "../../../whatsapp/interfaces/state";
import { PersonNumber } from "../../../whatsapp/types/types";
import { ProjetoManager } from "../../../services/projeto-manager";


class ProjetoAtividadeCriarState extends State implements IState {

  public async render(personNumber: PersonNumber): Promise<void> {
    const projetoSelecionado = ProjetoManager.getInstance().getProjetoSelecionado(personNumber)
    let message = `Muito bem, vamos adicionar uma nova atividade para o projeto *${projetoSelecionado.nome}*! Me diga o nome desta atividade!`;
    await this.client.sendMessage(personNumber, message, {
      footer: 'Separe com ";" para adicionar uma descrição'
    });
  }

  public async handleOption(body: string, personNumber: string) {
    const projetoSelecionado = this.fluxManager.projetoManager.getProjetoSelecionado(personNumber);
    let nome = ""
    let descricao = ""
    if (body.includes(";")) {
      const splittedBody = body.split(";")
      nome = splittedBody[0]
      descricao = splittedBody[1]
    }
    const novaAtividade = new Atividade(nome, projetoSelecionado, descricao ? descricao : undefined);
    projetoSelecionado.adicionarAtividade(novaAtividade)
    const sendingMessage = `A atividade com o nome: *${novaAtividade.nome}* foi criada no projeto: *${projetoSelecionado.nome}*. `
    await this.fluxManager.client.sendMessage(personNumber, sendingMessage);
    this.fluxManager.setPersonState(personNumber, "projeto-gerenciar").render(personNumber)
  }
}

export default ProjetoAtividadeCriarState;
