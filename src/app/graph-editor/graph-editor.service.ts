import { Injectable, signal, computed } from '@angular/core';
import { Command } from './models/command.model';
import { GraphState, GraphModel, EdgeModel, NodeModel, ViewTransform } from './models/graph.models';
import { NodeType } from './models/node-types';

@Injectable()
export class GraphEditorService {
  private state = signal<GraphState>({ nodes: [], edges: [] });
  private history: Command[] = [];
  private historyIndex = -1;

  readonly nodes = computed(() => this.state().nodes);
  readonly edges = computed(() => this.state().edges);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly viewTransform = signal<ViewTransform>({ x: 0, y: 0, scale: 1 });
  readonly inspectedNodeId = signal<string | null>(null);
  readonly inspectedNode = computed(() => {
    const id = this.inspectedNodeId();
    if (!id) return null;
    return this.state().nodes.find(n => n.id === id) ?? null;
  });
  private nextExtensionNumber = 800;

  // Filter state
  readonly filterByType = signal<Record<string, string[]>>({
    'did': [],
    'ivr': [],
    'ring-group': [],
    'call-queue': [],
    'extension': [],
  });
  readonly filterByDepartment = signal<string[]>([]);
  readonly isFilterActive = computed(() => {
    const byType = this.filterByType();
    const byDept = this.filterByDepartment();
    return byDept.length > 0 || Object.values(byType).some(ids => ids.length > 0);
  });
  readonly highlightedNodeIds = computed(() => this.computeHighlightedNodes());
  readonly highlightedEdgeIds = computed(() => this.computeHighlightedEdges());

  clearFilters(): void {
    this.filterByType.set({ 'did': [], 'ivr': [], 'ring-group': [], 'call-queue': [], 'extension': [] });
    this.filterByDepartment.set([]);
  }

  setTypeFilter(type: string, nodeIds: string[]): void {
    this.filterByType.update(f => ({ ...f, [type]: nodeIds }));
  }

  private computeHighlightedNodes(): Set<string> {
    if (!this.isFilterActive()) return new Set();

    const nodes = this.state().nodes;
    const edges = this.state().edges;
    const seedIds = new Set<string>();

    // Collect seed nodes from type filters
    const byType = this.filterByType();
    for (const ids of Object.values(byType)) {
      for (const id of ids) seedIds.add(id);
    }

    // Collect seed nodes from department filter
    const depts = this.filterByDepartment();
    if (depts.length > 0) {
      for (const n of nodes) {
        const dept = (n.meta?.['department'] as string) ?? '';
        if (dept && depts.includes(dept)) seedIds.add(n.id);
      }
    }

    if (seedIds.size === 0) return new Set();

    // Trace paths bidirectionally from seed nodes
    return this.traceAllPaths(seedIds, nodes, edges);
  }

  private computeHighlightedEdges(): Set<string> {
    if (!this.isFilterActive()) return new Set();
    const highlighted = this.highlightedNodeIds();
    if (highlighted.size === 0) return new Set();
    const result = new Set<string>();
    for (const e of this.state().edges) {
      if (highlighted.has(e.sourceId) && highlighted.has(e.targetId)) {
        result.add(e.id);
      }
    }
    return result;
  }

  private traceAllPaths(seedIds: Set<string>, nodes: NodeModel[], edges: EdgeModel[]): Set<string> {
    const result = new Set<string>(seedIds);

    // Build adjacency maps
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    for (const e of edges) {
      if (!outgoing.has(e.sourceId)) outgoing.set(e.sourceId, []);
      outgoing.get(e.sourceId)!.push(e.targetId);
      if (!incoming.has(e.targetId)) incoming.set(e.targetId, []);
      incoming.get(e.targetId)!.push(e.sourceId);
    }

    // BFS forward (downstream)
    const forwardQueue = [...seedIds];
    const visitedForward = new Set<string>(seedIds);
    while (forwardQueue.length > 0) {
      const current = forwardQueue.shift()!;
      for (const next of outgoing.get(current) ?? []) {
        if (!visitedForward.has(next)) {
          visitedForward.add(next);
          result.add(next);
          forwardQueue.push(next);
        }
      }
    }

    // BFS backward (upstream)
    const backwardQueue = [...seedIds];
    const visitedBackward = new Set<string>(seedIds);
    while (backwardQueue.length > 0) {
      const current = backwardQueue.shift()!;
      for (const prev of incoming.get(current) ?? []) {
        if (!visitedBackward.has(prev)) {
          visitedBackward.add(prev);
          result.add(prev);
          backwardQueue.push(prev);
        }
      }
    }

    return result;
  }

  assignExtensionNumber(): string {
    return String(this.nextExtensionNumber++);
  }

  execute(cmd: Command): void {
    const newState = cmd.execute(this.state());
    this.state.set(newState);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(cmd);
    this.historyIndex++;
  }

  undo(): void {
    if (this.historyIndex < 0) return;
    const cmd = this.history[this.historyIndex];
    this.state.update(s => cmd.undo(s));
    this.historyIndex--;
  }

  redo(): void {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    const cmd = this.history[this.historyIndex];
    this.state.update(s => cmd.execute(s));
  }

  loadGraph(graph: GraphModel): void {
    this.state.set({ nodes: [...graph.nodes], edges: [...graph.edges] });
    // loadGraph does not affect undo history — it is a controlled external sync
  }

  toGraphModel(): GraphModel {
    return { nodes: [...this.state().nodes], edges: [...this.state().edges] };
  }

  screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    const { x, y, scale } = this.viewTransform();
    return {
      x: (screenX - x) / scale,
      y: (screenY - y) / scale,
    };
  }

  snapToGrid(value: number, grid = 8): number {
    return Math.round(value / grid) * grid;
  }

  connectedEdges(nodeId: string): EdgeModel[] {
    return this.state().edges.filter(
      e => e.sourceId === nodeId || e.targetId === nodeId
    );
  }
}
