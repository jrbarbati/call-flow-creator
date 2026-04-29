import { Component, computed, inject, input, signal, NO_ERRORS_SCHEMA, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GraphEditorService } from '../../graph-editor.service';
import { Edge, Vertex } from '../../models/graph.models';
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
  readonly edge = input.required<Edge>();

  protected readonly service = inject(GraphEditorService);

  protected readonly isSelected = computed(() => this.service.selectedIds().has(this.edge().id));

  protected readonly isDimmed = computed(() => {
    if (!this.service.isFilterActive()) return false;
    return !this.service.highlightedEdgeIds().has(this.edge().id);
  });

  protected readonly isEditingLabel = signal(false);
  protected readonly editLabelValue = signal('');

  @ViewChild('edgeLabelInput') edgeLabelInput?: ElementRef<HTMLInputElement>;

  private readonly endpoints = computed(() => {
    const e = this.edge();
    const nodes = this.service.nodes();
    const src = nodes.find(n => n.id === e.sourceId);
    const tgt = nodes.find(n => n.id === e.targetId);
    return src && tgt ? { src, tgt } : null;
  });

  readonly pathD = computed(() => {
    const ep = this.endpoints();
    return ep ? this.bezierPath(ep.src, ep.tgt) : '';
  });

  readonly markerEnd = computed(() =>
    this.isSelected() ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'
  );

  readonly labelPosition = computed(() => {
    const ep = this.endpoints();
    if (!ep) return null;
    const sx = ep.src.x + ep.src.width;
    const sy = ep.src.y + ep.src.height / 2;
    const tx = ep.tgt.x;
    const ty = ep.tgt.y + ep.tgt.height / 2;
    return { x: (sx + tx) / 2, y: (sy + ty) / 2 - 8 };
  });

  private bezierPath(src: Vertex, tgt: Vertex): string {
    const sx = src.x + src.width;
    const sy = src.y + src.height / 2;
    const tx = tgt.x;
    const ty = tgt.y + tgt.height / 2;
    const dx = Math.max(Math.abs(tx - sx) * 0.5, 60);
    return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
  }

  onEdgeClick(event: MouseEvent): void {
    event.stopPropagation();
    this.service.selectedIds.set(new Set([this.edge().id]));
  }

  startLabelEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.isEditingLabel.set(true);
    this.editLabelValue.set(this.edge().label ?? '');
    setTimeout(() => this.edgeLabelInput?.nativeElement?.focus(), 0);
  }

  confirmLabelEdit(): void {
    if (!this.isEditingLabel()) return;
    this.isEditingLabel.set(false);
    const trimmed = this.editLabelValue().trim();
    const e = this.edge();
    if (trimmed !== (e.label ?? '')) {
      this.service.execute(new RenameEdgeCommand(e.id, e.label ?? '', trimmed));
    }
  }

  onLabelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.confirmLabelEdit();
    if (event.key === 'Escape') this.isEditingLabel.set(false);
    event.stopPropagation();
  }
}
