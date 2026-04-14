import { Command } from '../models/command.model';
import { GraphState, EdgeModel } from '../models/graph.models';

export class AddEdgeCommand implements Command {
  readonly description = 'Add edge';
  constructor(private readonly edge: EdgeModel) {}

  execute(state: GraphState): GraphState {
    return { ...state, edges: [...state.edges, this.edge] };
  }

  undo(state: GraphState): GraphState {
    return { ...state, edges: state.edges.filter(e => e.id !== this.edge.id) };
  }
}
