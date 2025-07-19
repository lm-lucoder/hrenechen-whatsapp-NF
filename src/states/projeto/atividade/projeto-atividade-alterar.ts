import State from "../../../classes/state";
import IState from "../../../whatsapp/interfaces/state";

class ProjetoAtividadeAlterarState extends State implements IState {

  public async handleOption(body: string | number, personNumber: string) {
    const projetoSelecionado = this.fluxManager.projetoManager.getProjetoSelecionado(personNumber);
    console.log('projetoSelecionado', projetoSelecionado)
    const atividadeParaAlterar = projetoSelecionado.getAtividade(body.toString());
    console.log('atividadeParaAlterar', atividadeParaAlterar)
    const oldName = atividadeParaAlterar.nome
    atividadeParaAlterar.nome = body.toString();
    const sendingMessage = `O nome da atividade foi renomeado de *${oldName}* para *${atividadeParaAlterar.nome}* no projeto: *${projetoSelecionado.nome}*. `
    await this.fluxManager.client.sendMessage(personNumber, sendingMessage);
    this.fluxManager.setPersonState(personNumber, "projeto-gerenciar").render(personNumber)
  }
}

export default ProjetoAtividadeAlterarState;
