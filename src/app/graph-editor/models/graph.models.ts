import { NodeType } from './node-types';
import { NodeData } from './node-data';

export interface Vertex {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data?: NodeData;
  meta?: Record<string, unknown>;
}

// Edges are derived from node data (each node's typed *Destination objects + IVR forwards
// + IVR timeoutDestination / invalidKeyDestination). They are not stored in Graph state.
export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  meta?: Record<string, unknown>;
}

export interface Graph {
  nodes: Vertex[];
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}
