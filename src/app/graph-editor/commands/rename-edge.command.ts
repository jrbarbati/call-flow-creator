import { Command } from '../models/command.model';
import { Graph } from '../models/graph.models';

export class RenameEdgeCommand implements Command {
  readonly description = 'Rename edge';
  constructor(
    private readonly edgeId: string,
    private readonly oldLabel: string,
    private readonly newLabel: string,
  ) {}

  execute(state: Graph): Graph {
    return {
      ...state,
      edges: state.edges.map(e =>
        e.id === this.edgeId ? { ...e, label: this.newLabel } : e
      ),
    };
  }

  undo(state: Graph): Graph {
    return {
      ...state,
      edges: state.edges.map(e =>
        e.id === this.edgeId ? { ...e, label: this.oldLabel } : e
      ),
    };
  }
}
