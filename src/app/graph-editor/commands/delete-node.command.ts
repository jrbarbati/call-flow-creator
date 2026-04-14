import { Command } from '../models/command.model';
import { GraphState, NodeModel, EdgeModel } from '../models/graph.models';

export class DeleteNodeCommand implements Command {
  readonly description = 'Delete node';
  constructor(
    private readonly node: NodeModel,
    private readonly connectedEdges: EdgeModel[]
  ) {}

  execute(state: GraphState): GraphState {
    const edgeIds = new Set(this.connectedEdges.map(e => e.id));
    return {
      nodes: state.nodes.filter(n => n.id !== this.node.id),
      edges: state.edges.filter(e => !edgeIds.has(e.id)),
    };
  }

  undo(state: GraphState): GraphState {
    return {
      nodes: [...state.nodes, this.node],
      edges: [...state.edges, ...this.connectedEdges],
    };
  }
}
