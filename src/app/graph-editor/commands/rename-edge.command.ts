import { Command } from '../models/command.model';
import { GraphState } from '../models/graph.models';

export class RenameEdgeCommand implements Command {
  readonly description = 'Rename edge';
  constructor(
    private readonly edgeId: string,
    private readonly oldLabel: string,
    private readonly newLabel: string,
  ) {}

  execute(state: GraphState): GraphState {
    return {
      ...state,
      edges: state.edges.map(e =>
        e.id === this.edgeId ? { ...e, label: this.newLabel } : e
      ),
    };
  }

  undo(state: GraphState): GraphState {
    return {
      ...state,
      edges: state.edges.map(e =>
        e.id === this.edgeId ? { ...e, label: this.oldLabel } : e
      ),
    };
  }
}
