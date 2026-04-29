import { Command } from '../models/command.model';
import { Graph, Edge } from '../models/graph.models';

export class DeleteEdgeCommand implements Command {
  readonly description = 'Delete edge';
  constructor(private readonly edge: Edge) {}

  execute(state: Graph): Graph {
    return { ...state, edges: state.edges.filter(e => e.id !== this.edge.id) };
  }

  undo(state: Graph): Graph {
    return { ...state, edges: [...state.edges, this.edge] };
  }
}
