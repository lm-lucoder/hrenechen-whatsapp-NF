import { Projeto } from "../../services/projeto";
import State from "../../classes/state";
import IState from "../../whatsapp/interfaces/state";
import { PersonNumber } from "../../whatsapp/types/types";
import { ProjetoManager } from "../../services/projeto-manager";


class ProjetoCriarState extends State implements IState {

    public async render(personNumber: PersonNumber): Promise<void> {
        const message = 'Perfeito, vamos criar um novo projeto. Primeiramente, como será o nome dele?';
        await this.fluxManager.client.sendMessage(personNumber, message);
    }

    public async handleOption(body: string, personNumber: string) {
        if (body.toLowerCase().replace(" ", "") == 'cancelar') {
            return await this.cancel(personNumber)
        }
        const manager = ProjetoManager.getInstance()
        const novoProjeto = new Projeto(body)
        manager.adicionarProjeto(novoProjeto)
        const sendingMessage = `Maravilha, o projeto com o nome: *${novoProjeto.nome}* foi criado. `
        await this.fluxManager.client.sendMessage(personNumber, sendingMessage);
        manager.selecionarProjeto(personNumber, novoProjeto)
        this.fluxManager.setPersonState(personNumber, "projeto-gerenciar").render(personNumber);
    }
}

export default ProjetoCriarState;
