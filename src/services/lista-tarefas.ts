import { Tarefa } from "./tarefa";

export class ListaTarefas {
  id: string;
  nome: string;
  tasks: Tarefa[];

  constructor(id: string, nome: string) {
    this.id = id;
    this.nome = nome;
    this.tasks = [];
  }

  adicionarTask(task: Tarefa) {
    this.tasks.push(task);
  }

  removerTask(taskId: string) {
    this.tasks = this.tasks.filter(task => task.id !== taskId);
  }
}
