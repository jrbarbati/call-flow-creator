import { Command } from '../models/command.model';
import { GraphState, EdgeModel } from '../models/graph.models';

export class DeleteEdgeCommand implements Command {
  readonly description = 'Delete edge';
  constructor(private readonly edge: EdgeModel) {}

  execute(state: GraphState): GraphState {
    return { ...state, edges: state.edges.filter(e => e.id !== this.edge.id) };
  }

  undo(state: GraphState): GraphState {
    return { ...state, edges: [...state.edges, this.edge] };
  }
}
