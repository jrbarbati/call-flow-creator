import { Command } from '../models/command.model';
import { Graph } from '../models/graph.models';

export class RenameNodeCommand implements Command {
  readonly description = 'Rename node';
  constructor(
    private readonly nodeId: string,
    private readonly from: string,
    private readonly to: string
  ) {}

  execute(state: Graph): Graph {
    return {
      ...state,
      nodes: state.nodes.map(n =>
        n.id === this.nodeId ? { ...n, label: this.to } : n
      ),
    };
  }

  undo(state: Graph): Graph {
    return {
      ...state,
      nodes: state.nodes.map(n =>
        n.id === this.nodeId ? { ...n, label: this.from } : n
      ),
    };
  }
}
