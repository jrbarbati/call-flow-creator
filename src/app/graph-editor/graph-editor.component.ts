import {
  Component, HostListener, effect, inject, input, output, untracked
} from '@angular/core';
import { GraphEditorService } from './graph-editor.service';
import { GraphCanvasComponent } from './components/graph-canvas/graph-canvas.component';
import { GraphPaletteComponent } from './components/graph-palette/graph-palette.component';
import { GraphDetailPanelComponent } from './components/graph-detail-panel/graph-detail-panel.component';
import { GraphFilterBarComponent } from './components/graph-filter-bar/graph-filter-bar.component';
import { Graph, Vertex } from './models/graph.models';
import { NODE_TYPE_CONFIGS, NodeType } from './models/node-types';
import { AddNodeCommand } from './commands/add-node.command';
import { DeleteNodeCommand } from './commands/delete-node.command';
import { DeleteEdgeCommand } from './commands/delete-edge.command';

@Component({
  selector: 'app-graph-editor',
  standalone: true,
  imports: [GraphCanvasComponent, GraphPaletteComponent, GraphDetailPanelComponent, GraphFilterBarComponent],
  providers: [GraphEditorService],
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.scss',
})
export class GraphEditorComponent {
  readonly graph = input.required<Graph>();
  readonly graphChange = output<Graph>();

  protected readonly service = inject(GraphEditorService);

  constructor() {
    // External graph input → load into service. Wrapped in untracked so we don't
    // pick up downstream signal reads as dependencies.
    effect(() => {
      const g = this.graph();
      untracked(() => this.service.loadGraph(g));
    });

    // Sync emit on every command (including those triggered from child
    // components). Effect-based watching would be async, which breaks callers
    // that expect graphChange immediately after service.execute returns.
    this.service.setCommandListener(() => this.emitGraph());
  }

  private emitGraph(): void {
    this.graphChange.emit({
      nodes: [...this.service.nodes()],
      edges: [...this.service.edges()],
    });
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const mod = isMac ? event.metaKey : event.ctrlKey;

    if (mod && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.service.undo();
    } else if (mod && event.key === 'z' && event.shiftKey) {
      event.preventDefault();
      this.service.redo();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      this.deleteSelected();
    }
  }

  onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('node-type')) {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const type = event.dataTransfer?.getData('node-type') as NodeType | undefined;
    if (!type || !NODE_TYPE_CONFIGS[type]) return;

    const canvasEl = (event.currentTarget as HTMLElement).querySelector('.canvas-host');
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const raw = this.service.screenToCanvas(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    let label = NODE_TYPE_CONFIGS[type].label;
    let meta: Record<string, unknown> | undefined;

    if (type === 'extension') {
      const extJson = event.dataTransfer?.getData('extension-data');
      if (extJson) {
        const ext = JSON.parse(extJson);
        label = `${ext.number} - ${ext.firstName} ${ext.lastName}`;
        meta = { extensionNumber: ext.number, firstName: ext.firstName, lastName: ext.lastName };
      }
    }

    const config = NODE_TYPE_CONFIGS[type];
    if (config.hasExtensionNumber && !meta?.['extensionNumber']) {
      const extNum = this.service.assignExtensionNumber();
      meta = { ...(meta || {}), extensionNumber: extNum };
    }

    const nodeHeight = NODE_TYPE_CONFIGS[type].hasExtensionNumber ? 75 : 59;
    const node: Vertex = {
      id: crypto.randomUUID(),
      type,
      label,
      x: this.service.snapToGrid(raw.x - 80),
      y: this.service.snapToGrid(raw.y - nodeHeight / 2),
      width: 160,
      height: nodeHeight,
      ...(meta ? { meta } : {}),
    };
    this.service.execute(new AddNodeCommand(node));
  }

  private deleteSelected(): void {
    const selected = this.service.selectedIds();
    for (const id of selected) {
      const node = this.service.nodes().find(n => n.id === id);
      if (node) {
        const connected = this.service.connectedEdges(id);
        this.service.execute(new DeleteNodeCommand(node, connected));
      }
      const edge = this.service.edges().find(e => e.id === id);
      if (edge) {
        this.service.execute(new DeleteEdgeCommand(edge));
      }
    }
    this.service.selectedIds.set(new Set());
  }
}
