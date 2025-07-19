import { Atividade } from "./atividade";
import { ProjetoManager } from "./projeto-manager";

export class Projeto {
  id: string;
  nome: string;
  atividades: Atividade[];
  manager: ProjetoManager

  constructor(nome: string) {
    this.manager = ProjetoManager.getInstance()
    this.id = (this.manager.contarProjetos() + 1).toString();
    this.nome = nome;
    this.atividades = [];
  }

  contarAtividades() {
    return this.atividades.length
  }

  descreverAtividades() {
    if (this.contarAtividades() > 0) {
      let mensagem = `*==Atividades do Projeto ${this.nome}==*\n`
      this.atividades.forEach((atividade, i) => {
        mensagem += `*${atividade.nome}:*\n`
        if (atividade.descricao) {
          mensagem += `_${atividade.descricao}_\n`
        }
      })
      return mensagem
    } else {
      return `Ainda não temos atividades neste projeto`
    }
  }

  adicionarAtividade(atividade: Atividade) {
    this.atividades.push(atividade);
  }

  removerAtividade(atividadeNome: string) {
    this.atividades = this.atividades.filter(atividade => atividade.nome.trim().toLowerCase() !== atividadeNome.trim().toLowerCase());
  }

  getAtividade(atividadeNome: string) {
    const atividade = this.atividades.find(atividade => atividade.nome.trim().toLowerCase().includes(atividadeNome.trim().toLowerCase()))
    return atividade
  }

  getAllAtividade() {
    return this.atividades
  }
}
