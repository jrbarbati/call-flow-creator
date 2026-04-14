import { NodeType } from './node-types';

export interface NodeModel {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  meta?: Record<string, unknown>;
}

export interface EdgeModel {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  meta?: Record<string, unknown>;
}

export interface GraphModel {
  nodes: NodeModel[];
  edges: EdgeModel[];
}

export interface GraphState {
  nodes: NodeModel[];
  edges: EdgeModel[];
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}
