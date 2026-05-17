import { Command } from '../models/command.model';
import { Graph } from '../models/graph.models';
import { NodeData } from '../models/node-data';
import { deriveLabel } from '../models/node-data.labels';

export class UpdateNodeDataCommand implements Command {
  readonly description = 'Update node data';
  constructor(
    private readonly nodeId: string,
    private readonly oldData: NodeData | undefined,
    private readonly newData: NodeData,
  ) {}

  execute(state: Graph): Graph {
    return {
      ...state,
      nodes: state.nodes.map(n => {
        if (n.id !== this.nodeId) return n;
        const derived = deriveLabel(n.type, this.newData);
        return { ...n, data: this.newData, label: derived ?? n.label };
      }),
    };
  }

  undo(state: Graph): Graph {
    return {
      ...state,
      nodes: state.nodes.map(n => {
        if (n.id !== this.nodeId) return n;
        const derived = this.oldData ? deriveLabel(n.type, this.oldData) : null;
        return { ...n, data: this.oldData, label: derived ?? n.label };
      }),
    };
  }
}
