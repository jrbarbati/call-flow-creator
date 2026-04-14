import { Command } from '../models/command.model';
import { GraphState, NodeModel } from '../models/graph.models';

export class AddNodeCommand implements Command {
  readonly description = 'Add node';
  constructor(private readonly node: NodeModel) {}

  execute(state: GraphState): GraphState {
    return { ...state, nodes: [...state.nodes, this.node] };
  }

  undo(state: GraphState): GraphState {
    return { ...state, nodes: state.nodes.filter(n => n.id !== this.node.id) };
  }
}
