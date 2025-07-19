export interface IResponsavel {
  id: string;
  nome: string;
  email: string;
}

export class Tarefa {
  id: string;
  descricao: string;
  completa: boolean;
  prazo: Date;
  responsaveis: IResponsavel[];

  constructor(id: string, descricao: string, prazo: Date, responsaveis: IResponsavel[] = []) {
    this.id = id;
    this.descricao = descricao;
    this.completa = false;
    this.prazo = prazo;
    this.responsaveis = responsaveis;
  }

  marcarComoCompleta() {
    this.completa = true;
  }

  adicionarResponsavel(responsavel: IResponsavel) {
    this.responsaveis.push(responsavel);
  }

  removerResponsavel(responsavelId: string) {
    this.responsaveis = this.responsaveis.filter(responsavel => responsavel.id !== responsavelId);
  }
}
