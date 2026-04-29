import { NodeType } from './node-types';

export interface Vertex {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  meta?: Record<string, unknown>;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  meta?: Record<string, unknown>;
}

export interface Graph {
  nodes: Vertex[];
  edges: Edge[];
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}
