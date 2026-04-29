import { Graph } from './graph.models';

export interface Command {
  execute(state: Graph): Graph;
  undo(state: Graph): Graph;
  readonly description: string;
}
