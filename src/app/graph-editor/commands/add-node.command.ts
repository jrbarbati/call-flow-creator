import { Command } from '../models/command.model';
import { Graph, Vertex } from '../models/graph.models';

export class AddNodeCommand implements Command {
  readonly description = 'Add node';
  constructor(private readonly node: Vertex) {}

  execute(state: Graph): Graph {
    return { ...state, nodes: [...state.nodes, this.node] };
  }

  undo(state: Graph): Graph {
    return { ...state, nodes: state.nodes.filter(n => n.id !== this.node.id) };
  }
}
