import { PersonNumber } from "../whatsapp/types/types";
import { Projeto } from "./projeto";

export class ProjetoManager {
  private static instance: ProjetoManager;
  projetos: Projeto[];
  private chatProjects: { [number: PersonNumber]: Projeto }

  private constructor() {
    this.projetos = [];
    this.chatProjects = {}
  }

  public static getInstance(): ProjetoManager {
    if (!ProjetoManager.instance) {
      ProjetoManager.instance = new ProjetoManager();
    }
    return ProjetoManager.instance;
  }

  selecionarProjeto(number: PersonNumber, projeto: Projeto | string) {
    if (projeto instanceof Projeto) {
      this.chatProjects[number] = projeto
    } else {
      this.chatProjects[number] = this.obterProjeto(projeto)
    }
  }
  desselecionarProjeto(number: PersonNumber) {
    if (this.chatProjects[number]) {
      delete this.chatProjects[number]
    } else {
      console.error("Tentativa de desselecionar projeto, mas não existe projeto selecionado, número:" + number)
    }
  }
  getProjetoSelecionado(number: PersonNumber) {
    if (this.chatProjects[number]) {
      return this.chatProjects[number]
    } else {
      return undefined
    }
  }

  adicionarProjeto(projeto: Projeto | string) {
    if (projeto instanceof Projeto) {
      this.projetos.push(projeto);
    }
    if (typeof projeto === "string") {
      const newProjeto = new Projeto(projeto)
      this.projetos.push(newProjeto)
    }
  }

  removerProjeto(projetoId: string) {
    this.projetos = this.projetos.filter(projeto => projeto.id !== projetoId);
  }

  obterProjeto(nome: string): Projeto | undefined {
    return this.projetos.find(projeto =>
      projeto.nome.toLowerCase().replace(" ", "")
      ===
      nome.toLowerCase().replace(" ", ""));
  }

  listarProjetos(): Projeto[] {
    return this.projetos;
  }

  contarProjetos(): number {
    return this.projetos.length
  }

  descreverProjetos() {
    const descricoes = this.projetos.map(projeto => {
      return projeto.descreverAtividades()
    })
    return descricoes.join("\n\n")
  }
}
