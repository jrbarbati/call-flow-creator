import { Command } from '../models/command.model';
import { Graph } from '../models/graph.models';

export class CompositeCommand implements Command {
  readonly description: string;
  constructor(private readonly children: Command[], description = 'Composite') {
    this.description = description;
  }

  execute(state: Graph): Graph {
    return this.children.reduce((s, c) => c.execute(s), state);
  }

  undo(state: Graph): Graph {
    return [...this.children].reverse().reduce((s, c) => c.undo(s), state);
  }
}
