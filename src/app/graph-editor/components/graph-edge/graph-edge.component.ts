import { Component, computed, inject, input, NO_ERRORS_SCHEMA } from '@angular/core';
import { GraphEditorService } from '../../graph-editor.service';
import { Edge, Vertex } from '../../models/graph.models';
import { DestinationTrigger } from '../../models/ringGroup';
import { triggerColorFor, triggerLabelFor, TRIGGER_COLORS } from '../../models/destination';

@Component({
  selector: 'g[app-graph-edge]',
  standalone: true,
  imports: [],
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

  private readonly endpoints = computed(() => {
    const e = this.edge();
    const nodes = this.service.nodes();
    const src = nodes.find(n => n.id === e.sourceId);
    const tgt = nodes.find(n => n.id === e.targetId);
    return src && tgt ? { src, tgt } : null;
  });

  readonly color = computed(() => {
    const meta = this.edge().meta ?? {};
    const kind = meta['kind'] as string | undefined;
    if (kind === 'forward') return triggerColorFor('FORWARD');
    if (kind === 'timeout') return triggerColorFor('TIMEOUT');
    if (kind === 'invalidkey') return triggerColorFor('INVALID_KEY');
    const trigger = meta['trigger'] as keyof typeof TRIGGER_COLORS | undefined;
    return trigger ? triggerColorFor(trigger) : '#9ca3af';
  });

  readonly displayLabel = computed(() => {
    const e = this.edge();
    const meta = e.meta ?? {};
    const kind = meta['kind'] as string | undefined;
    if (kind === 'forward') return e.label ?? '';
    if (kind === 'timeout') return 'Timeout';
    if (kind === 'invalidkey') return 'Invalid Key';
    const ep = this.endpoints();
    if (!ep) return '';
    return triggerLabelFor(ep.src.type, meta['trigger'] as DestinationTrigger);
  });

  readonly pathD = computed(() => {
    const ep = this.endpoints();
    return ep ? this.bezierPath(ep.src, ep.tgt) : '';
  });

  readonly labelPosition = computed(() => {
    const ep = this.endpoints();
    if (!ep) return null;
    const sx = ep.src.x + ep.src.width;
    const sy = ep.src.y + ep.src.height / 2;
    const tx = ep.tgt.x;
    const ty = ep.tgt.y + ep.tgt.height / 2;
    const t = 0.25;
    return { x: sx + (tx - sx) * t, y: sy + (ty - sy) * t - 8 };
  });

  readonly markerEnd = computed(() => this.isSelected() ? 'url(#arrowhead-selected)' : 'url(#arrowhead)');

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
}
