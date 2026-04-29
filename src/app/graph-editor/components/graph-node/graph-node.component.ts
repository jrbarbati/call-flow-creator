import {
  Component, inject, computed, signal, input, output, ElementRef, ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GraphEditorService } from '../../graph-editor.service';
import { Vertex } from '../../models/graph.models';
import { MoveNodeCommand } from '../../commands/move-node.command';
import { RenameNodeCommand } from '../../commands/rename-node.command';
import { DeleteNodeCommand } from '../../commands/delete-node.command';
import { NODE_TYPE_CONFIGS } from '../../models/node-types';

@Component({
  selector: 'g[app-graph-node]',
  standalone: true,
  imports: [FormsModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './graph-node.component.html',
  styleUrl: './graph-node.component.scss',
})
export class GraphNodeComponent {
  readonly node = input.required<Vertex>();
  readonly portDragStart = output<{ sourceId: string; position: { x: number; y: number } }>();
  readonly nodeDropTarget = output<Vertex>();
  readonly inspectNode = output<string>();

  protected readonly service = inject(GraphEditorService);
  protected readonly isHovered = signal(false);
  protected readonly isEditing = signal(false);
  protected readonly editLabel = signal('');

  @ViewChild('editInput') editInput?: ElementRef<HTMLInputElement>;

  protected readonly isSelected = computed(() => this.service.selectedIds().has(this.node().id));

  protected readonly isDimmed = computed(() => {
    if (!this.service.isFilterActive()) return false;
    return !this.service.highlightedNodeIds().has(this.node().id);
  });

  protected readonly typeConfig = computed(
    () => NODE_TYPE_CONFIGS[this.node().type] ?? NODE_TYPE_CONFIGS['extension']
  );

  protected readonly hasOutputPort = computed(() => this.typeConfig().hasOutputPort);

  protected readonly transform = computed(() => {
    const n = this.node();
    return `translate(${n.x},${n.y})`;
  });

  onMouseEnter(): void { this.isHovered.set(true); }
  onMouseLeave(): void { this.isHovered.set(false); }

  onNodeMouseDown(event: MouseEvent): void {
    if (this.isEditing()) return;
    event.stopPropagation();
    this.service.selectedIds.set(new Set([this.node().id]));
    this.startDrag(event);
  }

  onNodeMouseUp(_event: MouseEvent): void {
    this.nodeDropTarget.emit(this.node());
  }

  onPortMouseDown(event: MouseEvent): void {
    if (!this.hasOutputPort()) return;
    event.stopPropagation();
    const n = this.node();
    const portX = n.x + n.width;
    const portY = n.y + n.height / 2;
    this.portDragStart.emit({ sourceId: n.id, position: { x: portX, y: portY } });
  }

  startEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.isEditing.set(true);
    this.editLabel.set(this.node().label);
    setTimeout(() => this.editInput?.nativeElement?.focus(), 0);
  }

  confirmEdit(): void {
    if (!this.isEditing()) return;
    this.isEditing.set(false);
    const trimmed = this.editLabel().trim();
    const current = this.node();
    if (trimmed && trimmed !== current.label) {
      this.service.execute(new RenameNodeCommand(current.id, current.label, trimmed));
    }
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.confirmEdit();
    if (event.key === 'Escape') { this.isEditing.set(false); }
    event.stopPropagation();
  }

  openInspector(event: MouseEvent): void {
    event.stopPropagation();
    this.inspectNode.emit(this.node().id);
  }

  deleteNode(event: MouseEvent): void {
    event.stopPropagation();
    const n = this.node();
    const connected = this.service.connectedEdges(n.id);
    this.service.execute(new DeleteNodeCommand(n, connected));
  }

  private startDrag(event: MouseEvent): void {
    const scale = this.service.viewTransform().scale;
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const origNode = this.node();
    const origX = origNode.x;
    const origY = origNode.y;
    const nodeId = origNode.id;

    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - startClientX) / scale;
      const dy = (e.clientY - startClientY) / scale;
      const snappedX = this.service.snapToGrid(origX + dx);
      const snappedY = this.service.snapToGrid(origY + dy);
      this.service.applyLiveNodePosition(nodeId, snappedX, snappedY);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const finalNode = this.node();
      if (finalNode.x !== origX || finalNode.y !== origY) {
        this.service.execute(new MoveNodeCommand(nodeId, { x: origX, y: origY }, { x: finalNode.x, y: finalNode.y }));
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}
