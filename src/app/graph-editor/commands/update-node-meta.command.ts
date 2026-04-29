import { Command } from '../models/command.model';
import { Graph, Vertex } from '../models/graph.models';

export class UpdateNodeMetaCommand implements Command {
  readonly description = 'Update node metadata';
  constructor(
    private readonly nodeId: string,
    private readonly oldMeta: Record<string, unknown>,
    private readonly newMeta: Record<string, unknown>
  ) {}

  execute(state: Graph): Graph {
    return {
      ...state,
      nodes: state.nodes.map(n =>
        n.id === this.nodeId ? { ...n, meta: this.newMeta } : n
      )
    };
  }

  undo(state: Graph): Graph {
    return {
      ...state,
      nodes: state.nodes.map(n =>
        n.id === this.nodeId ? { ...n, meta: this.oldMeta } : n
      )
    };
  }
}
