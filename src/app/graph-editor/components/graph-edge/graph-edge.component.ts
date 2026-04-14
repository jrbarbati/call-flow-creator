import { Component, Input, Output, EventEmitter, computed, inject, NO_ERRORS_SCHEMA, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GraphEditorService } from '../../graph-editor.service';
import { EdgeModel, NodeModel } from '../../models/graph.models';
import { RenameEdgeCommand } from '../../commands/rename-edge.command';

@Component({
  selector: 'g[app-graph-edge]',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './graph-edge.component.html',
  styleUrl: './graph-edge.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class GraphEdgeComponent {
  @Input({ required: true }) edge!: EdgeModel;

  protected readonly service = inject(GraphEditorService);

  protected isSelected = computed(() => this.service.selectedIds().has(this.edge.id));

  protected isDimmed = computed(() => {
    if (!this.service.isFilterActive()) return false;
    return !this.service.highlightedEdgeIds().has(this.edge.id);
  });

  protected isEditingLabel = false;
  protected editLabelValue = '';

  @ViewChild('edgeLabelInput') edgeLabelInput?: ElementRef<HTMLInputElement>;

  get pathD(): string {
    const nodes = this.service.nodes();
    const src = nodes.find(n => n.id === this.edge.sourceId);
    const tgt = nodes.find(n => n.id === this.edge.targetId);
    if (!src || !tgt) return '';
    return this.bezierPath(src, tgt);
  }

  get markerEnd(): string {
    return this.isSelected() ? 'url(#arrowhead-selected)' : 'url(#arrowhead)';
  }

  get labelPosition(): { x: number; y: number } | null {
    const nodes = this.service.nodes();
    const src = nodes.find(n => n.id === this.edge.sourceId);
    const tgt = nodes.find(n => n.id === this.edge.targetId);
    if (!src || !tgt) return null;
    const sx = src.x + src.width;
    const sy = src.y + src.height / 2;
    const tx = tgt.x;
    const ty = tgt.y + tgt.height / 2;
    // Midpoint of bezier (approximate)
    return { x: (sx + tx) / 2, y: (sy + ty) / 2 - 8 };
  }

  private bezierPath(src: NodeModel, tgt: NodeModel): string {
    const sx = src.x + src.width;
    const sy = src.y + src.height / 2;
    const tx = tgt.x;
    const ty = tgt.y + tgt.height / 2;
    const dx = Math.max(Math.abs(tx - sx) * 0.5, 60);
    return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
  }

  onEdgeClick(event: MouseEvent): void {
    event.stopPropagation();
    this.service.selectedIds.set(new Set([this.edge.id]));
  }

  startLabelEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.isEditingLabel = true;
    this.editLabelValue = this.edge.label ?? '';
    setTimeout(() => this.edgeLabelInput?.nativeElement?.focus(), 0);
  }

  confirmLabelEdit(): void {
    if (!this.isEditingLabel) return;
    this.isEditingLabel = false;
    const trimmed = this.editLabelValue.trim();
    if (trimmed !== (this.edge.label ?? '')) {
      this.service.execute(new RenameEdgeCommand(this.edge.id, this.edge.label ?? '', trimmed));
    }
  }

  onLabelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.confirmLabelEdit();
    if (event.key === 'Escape') this.isEditingLabel = false;
    event.stopPropagation();
  }
}
