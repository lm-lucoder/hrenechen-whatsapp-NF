import { ProjetoManager } from "../../services/projeto-manager";
import State from "../../classes/state";
import FluxManager from "../../whatsapp/fluxManager";
import IState from "../../whatsapp/interfaces/state";
import { PersonNumber } from "../../whatsapp/types/types";

class ProjetoGerenciar extends State implements IState {

  constructor(fluxManager: FluxManager) {
    super(fluxManager)
    this.optionsMap = {
      "Listar Atividades​": this.optionListarAtividades.bind(this),
      "Adicionar Atividade": this.optionCriarAtividade.bind(this),
      "Deletar Atividades": this.optionDeletarAtividade.bind(this),
    };
  }

  public async render(personNumber: PersonNumber) {
    let message = ""
    const projetoSelecionado = ProjetoManager.getInstance().getProjetoSelecionado(personNumber)
    if (projetoSelecionado) {
      message = `Vamos gerenciar o projeto ${projetoSelecionado.nome}? O que deseja fazer neste projeto?\n`
      message += projetoSelecionado.descreverAtividades();
    } else {
      this.fluxManager.setPersonState(personNumber, "selecionar-projeto").render(personNumber)
    }
    this.fluxManager.setPersonState(personNumber, "projeto-gerenciar");
    /* await this.client.sendMessage(personNumber, message, projetoSelecionado ? {
      type: "list",
      listOptions: [
        {
          sectionName: "Atividades", rows: [
            { name: "Listar Atividades​", description: "Lista todas as atividades existentes neste projeto." },
            { name: "Adicionar Atividade", description: "Adiciona uma nova atividade neste projeto." },
            { name: "Deletar Atividades", description: "Deleta uma das atividades existentes neste projeto." },
          ]
        },
        {
          sectionName: "Outros", rows: [
            { name: "Cancelar", description: "Desistir e retornar à etapa inicial." }
          ]
        }
      ]
    } : undefined); */
    await this.client.sendMessage(personNumber, message, projetoSelecionado ? {
      type: "buttons",
      options: [
        { name: "Adicionar Atividade" },
        { name: "Deletar Atividades" },
        { name: "Cancelar" }
      ]
    } : undefined);
  };

  private async optionCriarAtividade(personNumber: PersonNumber) {
    this.fluxManager.setPersonState(personNumber, 'projeto-atividade-criar').render(personNumber)
  }

  private async optionDeletarAtividade(personNumber: PersonNumber) {
    const projetoSelecionado = ProjetoManager.getInstance().getProjetoSelecionado(personNumber)
    if (projetoSelecionado.contarAtividades() > 0) {
      this.fluxManager.setPersonState(personNumber, 'projeto-atividade-deletar').render(personNumber)
    } else {
      await this.client.sendMessage(personNumber, `Ainda não há nenhuma atividade registrada no projeto *${projetoSelecionado.nome}*!`)
      await this.render(personNumber)
    }
  }

  private async optionListarAtividades(personNumber: PersonNumber) {
    const projetoSelecionado = ProjetoManager.getInstance().getProjetoSelecionado(personNumber)
    let message = projetoSelecionado.descreverAtividades();
    await this.client.sendMessage(personNumber, message);
    await this.render(personNumber)
  }



  public async handleOption(body: string, personNumber: PersonNumber) {
    if (body.toLowerCase().replace(" ", "") == 'cancelar') {
      return this.cancel(personNumber)
    }
    const projetoSelecionado = this.fluxManager.projetoManager.getProjetoSelecionado(personNumber)
    if (projetoSelecionado) {
      const action = this.getAction(body);
      if (action) {
        action(personNumber);
      } else {
        const message = 'Opção inválida. Por favor, escolha uma das opções disponíveis.';
        await this.fluxManager.client.sendMessage(personNumber, message);
      }
    } else {
      const projeto = this.fluxManager.projetoManager.obterProjeto(body.toString())
      if (!projeto) {
        return this.client.sendMessage(personNumber, "Não encontrei esse projeto que você mencionou. Tem certeza que o nome é esse? Repita o nome, por favor. Ou escreva 'cancelar' para desistir")
      }

    }
  }
}

export default ProjetoGerenciar;
