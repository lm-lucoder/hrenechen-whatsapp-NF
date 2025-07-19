import State from "../classes/state";
import FluxManager from "../whatsapp/fluxManager";
import IState from "../whatsapp/interfaces/state";
import { PersonNumber } from "../whatsapp/types/types";
import { ProjetoManager } from "../services/projeto-manager";
import { Projeto } from "../services/projeto";
import AppError from "../whatsapp/errors/AppError";
import { Atividade } from "../services/atividade";

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
      + `\n _Temos um total de *${this.fluxManager.projetoManager.contarProjetos()}* projetos ativos_`
    await this.fluxManager.client.sendMessage(personNumber, message, {
      type: "buttons",
      /* listOptions: [
        {
          sectionName: "Projetos", rows: [
            { name: "Gerir um projeto", description: "Administra um projeto já existente." },
            { name: "Criar um projeto", description: "Cria projetos novos de acordo com a descrição informada." },
            { name: "Listar tudo", description: "Lista todos os projetos existentes." },
          ]
        }
      ] */
      options: [
        { name: "Criar um projeto" },
        { name: "Gerir um projeto" },
        { name: "Listar tudo" }
      ]
    });
  }

  private handleOption1 = async (personNumber: PersonNumber) => {
    this.fluxManager.setPersonState(personNumber, "selecionar-projeto").render(personNumber);
  };

  private handleOption2 = async (personNumber: PersonNumber) => {
    this.fluxManager.setPersonState(personNumber, "projeto-criar").render(personNumber);
  };

  private handleOption3 = async (personNumber: PersonNumber) => {
    if (ProjetoManager.getInstance().projetos.length > 0) {
      const message = this.fluxManager.projetoManager.descreverProjetos()
      await this.fluxManager.client.sendMessage(personNumber, message);
      this.render(personNumber)
    } else {
      await this.fluxManager.client.sendMessage(personNumber, "Ainda não temos nenhum projeto ativo.")
      this.render(personNumber)
    }
  };

  private _macroCriarProjeto = async (personNumber: PersonNumber, body: string) => {
    const data = body.split(" ")
    if (data[1]) {
      const projetoManager = ProjetoManager.getInstance()
      const novoProjeto = new Projeto(data.slice(1).join(" ").replace("\n", ""))
      projetoManager.adicionarProjeto(novoProjeto)
      const sendingMessage = `Maravilha, o projeto com o nome: *${novoProjeto.nome}* foi criado. `
      await this.fluxManager.client.sendMessage(personNumber, sendingMessage);
      this.render(personNumber)
    } else {
      const sendingMessage = `Não foi possível identificar o nome do projeto. Certifique-se de usar o macro neste padrão:\n"/criarprojeto Nome do projeto"`
      await this.fluxManager.client.sendMessage(personNumber, sendingMessage);
    }

  }
  private _macroCriarAtividade = async (personNumber: PersonNumber, body: string) => {
    try {
      const rawData = body.split("/")
      if (!rawData[1]) throw new AppError()
      // Verifica a primeira parte do macro e busca o projeto
      const macroData = rawData[1].split(" ")
      const nomeDoProjeto = macroData.slice(1).join(" ");
      if (!nomeDoProjeto) throw new AppError()
      let projeto = this.fluxManager.projetoManager.obterProjeto(nomeDoProjeto)
      //if (!projeto) return await this.fluxManager.client.sendMessage(personNumber, `Projeto "${nomeDoProjeto}" não encontrado!`)
      if (!projeto) {
        projeto = new Projeto(nomeDoProjeto.replace("\n", ""))
        this.fluxManager.projetoManager.adicionarProjeto(projeto)
        await this.fluxManager.client.sendMessage(personNumber, `Um novo projeto foi criado com o nome "${nomeDoProjeto}"`)
      }

      // Verifica o resto do macro para adicionar as atividades em massa
      const atividadesCommands = rawData.slice(2)
      for (const atividadeCommand of atividadesCommands) {
        let atividadeNome = ""
        let atividadeDescricao = ""
        if (!atividadeCommand) continue;
        if (atividadeCommand.includes(";")) {
          atividadeNome = atividadeCommand.split(";")[0].replace("\n", "")
          atividadeDescricao = atividadeCommand.split(";")[1].replace("\n", "")
        } else {
          atividadeNome = atividadeCommand
        }
        const novaAtividade = new Atividade(atividadeNome, projeto, atividadeDescricao ? atividadeDescricao : undefined);
        projeto.adicionarAtividade(novaAtividade)
      }

      await this.fluxManager.client.sendMessage(personNumber, `Atividades criadas no projeto "${nomeDoProjeto}"! Agora o projeto está assim:\n${projeto.descreverAtividades()}`);
      this.render(personNumber)
    } catch (error) {
      console.error(error)
      await this.fluxManager.client.sendMessage(personNumber, "Algo deu errado, não foi possível utilizar este macro!");
    }
  }

  public async handleOption(body: string, personNumber: PersonNumber) {
    if (body.toLowerCase().replace(" ", "") == 'cancelar') {
      return await this.cancel(personNumber)
    }
    if (body.toLowerCase().replace(" ", "").includes('/criarprojeto')) {
      return await this._macroCriarProjeto(personNumber, body)
    }
    if (body.toLowerCase().replace(" ", "").includes('/criaratividades')) {
      return await this._macroCriarAtividade(personNumber, body)
    }
    const action = this.getAction(body);
    if (action) {
      action(personNumber);
    } else {
      const message = 'Opção inválida. Por favor, escolha uma das opções disponíveis.';
      await this.fluxManager.client.sendMessage(personNumber, message);
    }
  }
}

export default WelcomeState;
