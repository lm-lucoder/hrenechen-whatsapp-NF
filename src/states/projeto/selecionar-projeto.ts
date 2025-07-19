import State from "../../classes/state";
import IState from "../../whatsapp/interfaces/state";
import { PersonNumber } from "../../whatsapp/types/types";
import { ProjetoManager } from "../../services/projeto-manager";

class SelecionarProjetoState extends State implements IState {

  public async render(personNumber: PersonNumber): Promise<void> {
    const projetos = ProjetoManager.getInstance().listarProjetos();
    const message = 'Muito bem, escolha o projeto que você quer administrar.';
    await this.client.sendMessage(personNumber, message, {
      type: "list",
      listOptions: [
        {
          sectionName: "Projetos",
          rows: projetos.map(projeto => {
            return { name: projeto.nome, description: projeto.nome }
          })
        },
        {
          sectionName: "Outros", rows: [
            { name: "Cancelar", description: "Desistir e retornar à etapa inicial." }
          ]
        }
      ]
    });
  }

  public async handleOption(body: string, personNumber: string) {
    if (body.toLowerCase().replace(" ", "") == 'cancelar') {
      return this.cancel(personNumber)
    }
    const projetoManager = ProjetoManager.getInstance();
    const projeto = projetoManager.obterProjeto(body.toString().trim().toLowerCase())
    if (projeto) {
      projetoManager.selecionarProjeto(personNumber, projeto)
      this.fluxManager.setPersonState(personNumber, "projeto-gerenciar").render(personNumber)
    } else {
      await this.fluxManager.client.sendMessage(personNumber, `Projeto com nome "${body}" não encontrado!`);
      await this.fluxManager.setPersonState(personNumber, "welcome").render(personNumber)
    }
  }

}

export default SelecionarProjetoState;
