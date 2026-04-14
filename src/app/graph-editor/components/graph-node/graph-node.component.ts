import {
  Component, Input, Output, EventEmitter, inject, computed, ElementRef, ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GraphEditorService } from '../../graph-editor.service';
import { NodeModel } from '../../models/graph.models';
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
  @Input({ required: true }) node!: NodeModel;
  @Output() portDragStart = new EventEmitter<{ sourceId: string; position: { x: number; y: number } }>();
  @Output() nodeDropTarget = new EventEmitter<NodeModel>();
  @Output() inspectNode = new EventEmitter<string>();

  protected readonly service = inject(GraphEditorService);
  protected isHovered = false;
  protected isEditing = false;
  protected editLabel = '';

  @ViewChild('editInput') editInput?: ElementRef<HTMLInputElement>;

  protected isSelected = computed(() => this.service.selectedIds().has(this.node.id));

  protected isDimmed = computed(() => {
    if (!this.service.isFilterActive()) return false;
    return !this.service.highlightedNodeIds().has(this.node.id);
  });

  protected get typeConfig() {
    return NODE_TYPE_CONFIGS[this.node.type] ?? NODE_TYPE_CONFIGS['extension'];
  }

  protected get hasOutputPort(): boolean {
    return this.typeConfig.hasOutputPort;
  }

  get transform(): string {
    return `translate(${this.node.x},${this.node.y})`;
  }

  onMouseEnter(): void { this.isHovered = true; }
  onMouseLeave(): void { this.isHovered = false; }

  onNodeMouseDown(event: MouseEvent): void {
    if (this.isEditing) return;
    event.stopPropagation();
    this.service.selectedIds.set(new Set([this.node.id]));
    this.startDrag(event);
  }

  onNodeMouseUp(event: MouseEvent): void {
    this.nodeDropTarget.emit(this.node);
  }

  onPortMouseDown(event: MouseEvent): void {
    if (!this.hasOutputPort) return;
    event.stopPropagation();
    const portX = this.node.x + this.node.width;
    const portY = this.node.y + this.node.height / 2;
    this.portDragStart.emit({ sourceId: this.node.id, position: { x: portX, y: portY } });
  }

  startEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.isEditing = true;
    this.editLabel = this.node.label;
    setTimeout(() => this.editInput?.nativeElement?.focus(), 0);
  }

  confirmEdit(): void {
    if (!this.isEditing) return;
    this.isEditing = false;
    const trimmed = this.editLabel.trim();
    if (trimmed && trimmed !== this.node.label) {
      this.service.execute(new RenameNodeCommand(this.node.id, this.node.label, trimmed));
    }
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.confirmEdit();
    if (event.key === 'Escape') { this.isEditing = false; }
    event.stopPropagation();
  }

  openInspector(event: MouseEvent): void {
    event.stopPropagation();
    this.inspectNode.emit(this.node.id);
  }

  deleteNode(event: MouseEvent): void {
    event.stopPropagation();
    const connected = this.service.connectedEdges(this.node.id);
    this.service.execute(new DeleteNodeCommand(this.node, connected));
  }

  private startDrag(event: MouseEvent): void {
    const scale = this.service.viewTransform().scale;
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const origX = this.node.x;
    const origY = this.node.y;

    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - startClientX) / scale;
      const dy = (e.clientY - startClientY) / scale;
      const snappedX = this.service.snapToGrid(origX + dx);
      const snappedY = this.service.snapToGrid(origY + dy);
      // Direct state mutation for live drag feedback (committed as command on mouseup)
      (this.service as any)['state'].update((s: any) => ({
        ...s,
        nodes: s.nodes.map((n: NodeModel) =>
          n.id === this.node.id ? { ...n, x: snappedX, y: snappedY } : n
        ),
      }));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const finalX = this.node.x;
      const finalY = this.node.y;
      if (finalX !== origX || finalY !== origY) {
        this.service.execute(new MoveNodeCommand(this.node.id, { x: origX, y: origY }, { x: finalX, y: finalY }));
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}
