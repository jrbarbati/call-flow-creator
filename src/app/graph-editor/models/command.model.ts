import { GraphState } from './graph.models';

export interface Command {
  execute(state: GraphState): GraphState;
  undo(state: GraphState): GraphState;
  readonly description: string;
}
