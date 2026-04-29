import { Command } from '../models/command.model';
import { Graph, Vertex, Edge } from '../models/graph.models';

export class DeleteNodeCommand implements Command {
  readonly description = 'Delete node';
  constructor(
    private readonly node: Vertex,
    private readonly connectedEdges: Edge[]
  ) {}

  execute(state: Graph): Graph {
    const edgeIds = new Set(this.connectedEdges.map(e => e.id));
    return {
      nodes: state.nodes.filter(n => n.id !== this.node.id),
      edges: state.edges.filter(e => !edgeIds.has(e.id)),
    };
  }

  undo(state: Graph): Graph {
    return {
      nodes: [...state.nodes, this.node],
      edges: [...state.edges, ...this.connectedEdges],
    };
  }
}
