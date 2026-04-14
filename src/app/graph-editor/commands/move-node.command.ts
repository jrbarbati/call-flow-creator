import { Command } from '../models/command.model';
import { GraphState } from '../models/graph.models';

export class MoveNodeCommand implements Command {
  readonly description = 'Move node';
  constructor(
    private readonly nodeId: string,
    private readonly from: { x: number; y: number },
    private readonly to: { x: number; y: number }
  ) {}

  execute(state: GraphState): GraphState {
    return {
      ...state,
      nodes: state.nodes.map(n =>
        n.id === this.nodeId ? { ...n, x: this.to.x, y: this.to.y } : n
      ),
    };
  }

  undo(state: GraphState): GraphState {
    return {
      ...state,
      nodes: state.nodes.map(n =>
        n.id === this.nodeId ? { ...n, x: this.from.x, y: this.from.y } : n
      ),
    };
  }
}
