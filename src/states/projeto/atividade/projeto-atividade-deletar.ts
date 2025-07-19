import State from "../../../classes/state";
import IState from "../../../whatsapp/interfaces/state";
import { PersonNumber } from "../../../whatsapp/types/types";
import { ProjetoManager } from "../../../services/projeto-manager";

class ProjetoAtividadeDeletarState extends State implements IState {

  public async render(personNumber: PersonNumber): Promise<void> {
    const projetoSelecionado = ProjetoManager.getInstance().getProjetoSelecionado(personNumber)
    let message = `Vamos deletar uma atividade do projeto *${projetoSelecionado.nome}*!`
    const listOptions = [
      {
        sectionName: "Atividades", rows: projetoSelecionado.getAllAtividade().map(atividade => {
          //Renderiza todas as atividades como opções de lista
          const row: { name: string, description?: string } = {
            name: atividade.nome
          }
          if (atividade.descricao) {
            row.description = atividade.descricao
          } else {
            row.description = atividade.nome
          }
          return row
        })
      },
      {
        sectionName: "Outros", rows: [
          { name: "Cancelar", description: "Desistir e retornar à etapa inicial." }
        ]
      }
    ]
    await this.client.sendMessage(personNumber, message, {
      type: "list",
      footer: "Escolha uma atividade abaixo",
      listOptions
    });
  }
  public async handleOption(body: string, personNumber: string) {
    if (body.toLowerCase().replace(" ", "") == 'cancelar') {
      return this.cancel(personNumber)
    }
    const projetoSelecionado = this.fluxManager.projetoManager.getProjetoSelecionado(personNumber);
    const atividadeParaDeletar = projetoSelecionado.getAtividade(body.replace("...", ""));
    if (!atividadeParaDeletar) {
      return this.client.sendMessage(personNumber, "Atividade não encontrada!")
    }
    const deletingName = atividadeParaDeletar.nome
    const sendingMessage = `A atividade *${deletingName}* foi excluída, no projeto: *${projetoSelecionado.nome}*. `
    projetoSelecionado.removerAtividade(atividadeParaDeletar.nome);
    await this.fluxManager.client.sendMessage(personNumber, sendingMessage);
    this.fluxManager.setPersonState(personNumber, "projeto-gerenciar").render(personNumber)
  }
}

export default ProjetoAtividadeDeletarState;
