import { Injectable, computed, inject, signal } from '@angular/core';
import { Command } from './models/command.model';
import { Graph, Edge, Vertex, ViewTransform } from './models/graph.models';
import { EdgeDerivationService } from './services/edge-derivation.service';
import { AutoSpawnService } from './services/auto-spawn.service';
import { CompositeCommand } from './commands/composite.command';

@Injectable()
export class GraphEditorService {
  private state = signal<Graph>({ nodes: [] });
  private history: Command[] = [];
  private historyIndex = -1;
  private commandListener: (() => void) | null = null;

  private readonly edgeDerivation = inject(EdgeDerivationService);
  private readonly autoSpawn = inject(AutoSpawnService);

  setCommandListener(fn: (() => void) | null): void {
    this.commandListener = fn;
  }

  readonly nodes = computed(() => this.state().nodes);
  readonly derivedEdges = computed(() => this.edgeDerivation.deriveEdges(this.state().nodes));
  readonly edges = this.derivedEdges; // backward-compat alias

  readonly selectedIds = signal<Set<string>>(new Set());
  readonly viewTransform = signal<ViewTransform>({ x: 0, y: 0, scale: 1 });
  readonly inspectedNodeId = signal<string | null>(null);
  readonly inspectedNode = computed(() => {
    const id = this.inspectedNodeId();
    if (!id) return null;
    return this.state().nodes.find(n => n.id === id) ?? null;
  });

  private nextExtensionNumber = 800;

  readonly filterByType = signal<Record<string, string[]>>({
    'did': [], 'ivr': [], 'ring-group': [], 'call-queue': [], 'extension': [],
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

  // -----------------------------------------------------------------------

  execute(cmd: Command): void {
    const afterCmd = cmd.execute(this.state());
    const spawns = this.autoSpawn.requiredSpawns(afterCmd.nodes);
    if (spawns.length === 0) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(cmd);
      this.historyIndex++;
      this.state.set(afterCmd);
    } else {
      const composite = new CompositeCommand([cmd, ...spawns], cmd.description);
      const finalState = composite.execute(this.state());
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(composite);
      this.historyIndex++;
      this.state.set(finalState);
    }
    this.commandListener?.();
  }

  undo(): void {
    if (this.historyIndex < 0) return;
    const cmd = this.history[this.historyIndex];
    this.state.update(s => cmd.undo(s));
    this.historyIndex--;
    this.commandListener?.();
  }

  redo(): void {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    const cmd = this.history[this.historyIndex];
    this.state.update(s => cmd.execute(s));
    this.commandListener?.();
  }

  loadGraph(graph: Graph): void {
    const cleaned: Graph = { nodes: [...graph.nodes] };
    const spawns = this.autoSpawn.requiredSpawns(cleaned.nodes);
    const final = spawns.reduce((s, c) => c.execute(s), cleaned);
    this.state.set(final);
  }

  applyLiveNodePosition(nodeId: string, x: number, y: number): void {
    this.state.update(s => ({
      ...s,
      nodes: s.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n),
    }));
  }

  assignExtensionNumber(): string {
    return String(this.nextExtensionNumber++);
  }

  toGraphModel(): Graph {
    return { nodes: [...this.state().nodes] };
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

  connectedEdges(nodeId: string): Edge[] {
    return this.derivedEdges().filter(e => e.sourceId === nodeId || e.targetId === nodeId);
  }

  // -----------------------------------------------------------------------

  private computeHighlightedNodes(): Set<string> {
    if (!this.isFilterActive()) return new Set();

    const nodes = this.state().nodes;
    const edges = this.derivedEdges();
    const seedIds = new Set<string>();

    const byType = this.filterByType();
    for (const ids of Object.values(byType)) {
      for (const id of ids) seedIds.add(id);
    }

    const depts = this.filterByDepartment();
    if (depts.length > 0) {
      for (const n of nodes) {
        const dept = nodeDepartmentName(n);
        if (dept && depts.includes(dept)) seedIds.add(n.id);
      }
    }

    if (seedIds.size === 0) return new Set();
    return this.traceAllPaths(seedIds, nodes, edges);
  }

  private computeHighlightedEdges(): Set<string> {
    if (!this.isFilterActive()) return new Set();
    const highlighted = this.highlightedNodeIds();
    if (highlighted.size === 0) return new Set();
    const result = new Set<string>();
    for (const e of this.derivedEdges()) {
      if (highlighted.has(e.sourceId) && highlighted.has(e.targetId)) {
        result.add(e.id);
      }
    }
    return result;
  }

  private traceAllPaths(seedIds: Set<string>, _nodes: Vertex[], edges: Edge[]): Set<string> {
    const result = new Set<string>(seedIds);
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    for (const e of edges) {
      if (!outgoing.has(e.sourceId)) outgoing.set(e.sourceId, []);
      outgoing.get(e.sourceId)!.push(e.targetId);
      if (!incoming.has(e.targetId)) incoming.set(e.targetId, []);
      incoming.get(e.targetId)!.push(e.sourceId);
    }

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
}

function nodeDepartmentName(n: Vertex): string {
  const d = n.data as { departmentName?: string | null } | undefined;
  return d?.departmentName ?? '';
}
