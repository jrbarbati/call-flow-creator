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
import { SetDestinationCommand } from './commands/set-destination.command';
import { ModalService } from './services/modal.service';
import { ModalOutletComponent } from './components/modal-outlet/modal-outlet.component';
import { createDefaultNodeData } from './models/node-data.factory';
import { parseEdgeId, edgeIdToSlot } from './models/destination';

@Component({
  selector: 'app-graph-editor',
  standalone: true,
  imports: [GraphCanvasComponent, GraphPaletteComponent, GraphDetailPanelComponent, GraphFilterBarComponent, ModalOutletComponent],
  providers: [GraphEditorService, ModalService],
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.scss',
})
export class GraphEditorComponent {
  readonly graph = input.required<Graph>();
  readonly graphChange = output<Graph>();

  protected readonly service = inject(GraphEditorService);

  constructor() {
    effect(() => {
      const g = this.graph();
      untracked(() => this.service.loadGraph(g));
    });

    this.service.setCommandListener(() => this.emitGraph());
  }

  private emitGraph(): void {
    this.graphChange.emit({
      nodes: [...this.service.nodes()],
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

    const config = NODE_TYPE_CONFIGS[type];
    let label = config.label;
    let meta: Record<string, unknown> | undefined;

    if (type === 'extension') {
      const extJson = event.dataTransfer?.getData('extension-data');
      if (extJson) {
        const ext = JSON.parse(extJson);
        label = `${ext.number} - ${ext.firstName} ${ext.lastName}`;
        meta = { extensionNumber: ext.number, firstName: ext.firstName, lastName: ext.lastName };
      }
    }

    if (config.hasExtensionNumber && !meta?.['extensionNumber']) {
      const extNum = this.service.assignExtensionNumber();
      meta = { ...(meta || {}), extensionNumber: extNum };
    }

    const nodeHeight = config.isTerminal ? 36 : (config.hasExtensionNumber ? 75 : 59);
    const width = config.isTerminal ? 120 : 160;
    const node: Vertex = {
      id: crypto.randomUUID(),
      type,
      label,
      x: this.service.snapToGrid(raw.x - width / 2),
      y: this.service.snapToGrid(raw.y - nodeHeight / 2),
      width,
      height: nodeHeight,
      ...(meta ? { meta } : {}),
    };
    node.data = createDefaultNodeData(type, {
      label: node.label,
      extensionNumber: meta?.['extensionNumber'] as string | undefined,
      firstName: meta?.['firstName'] as string | undefined,
      lastName: meta?.['lastName'] as string | undefined,
    });
    this.service.execute(new AddNodeCommand(node));
  }

  private deleteSelected(): void {
    const selected = this.service.selectedIds();
    for (const id of selected) {
      const node = this.service.nodes().find(n => n.id === id);
      if (node) {
        this.service.execute(new DeleteNodeCommand(node));
        continue;
      }
      const parsed = parseEdgeId(id);
      if (parsed) {
        const slot = edgeIdToSlot(parsed);
        this.service.execute(new SetDestinationCommand(parsed.sourceId, slot, { kind: 'clear' }));
      }
    }
    this.service.selectedIds.set(new Set());
  }
}
