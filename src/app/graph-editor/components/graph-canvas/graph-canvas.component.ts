import {
  Component, computed, inject, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphEditorService } from '../../graph-editor.service';
import { NodeModel, EdgeModel } from '../../models/graph.models';
import { AddEdgeCommand } from '../../commands/add-edge.command';
import { GraphNodeComponent } from '../graph-node/graph-node.component';
import { GraphEdgeComponent } from '../graph-edge/graph-edge.component';

@Component({
  selector: 'app-graph-canvas',
  standalone: true,
  imports: [CommonModule, GraphNodeComponent, GraphEdgeComponent],
  templateUrl: './graph-canvas.component.html',
  styleUrl: './graph-canvas.component.scss',
})
export class GraphCanvasComponent {
  protected readonly service = inject(GraphEditorService);

  readonly svgTransform = computed(() => {
    const { x, y, scale } = this.service.viewTransform();
    return `translate(${x},${y}) scale(${scale})`;
  });

  // Pan state
  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  private transformAtPanStart = { x: 0, y: 0 };

  // Edge drawing state
  protected isDrawingEdge = false;
  protected edgeSourceId: string | null = null;
  protected liveEdgeEnd = { x: 0, y: 0 };
  protected liveEdgeStart = { x: 0, y: 0 };

  // Rubber-band state
  protected isSelecting = false;
  protected selectionRect = { x: 0, y: 0, width: 0, height: 0 };
  private selectionStart = { x: 0, y: 0 };

  @ViewChild('svgRoot') svgRoot!: ElementRef<SVGSVGElement>;

  onSvgMouseDown(event: MouseEvent): void {
    if ((event.target as Element).closest('.graph-node, .graph-edge')) return;
    this.service.selectedIds.set(new Set());

    const pt = this.svgPoint(event);
    this.selectionStart = pt;
    this.selectionRect = { x: pt.x, y: pt.y, width: 0, height: 0 };
    this.isSelecting = true;
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isPanning) {
      const dx = event.clientX - this.panStart.x;
      const dy = event.clientY - this.panStart.y;
      this.service.viewTransform.update(t => ({
        ...t,
        x: this.transformAtPanStart.x + dx,
        y: this.transformAtPanStart.y + dy,
      }));
    }

    if (this.isSelecting) {
      const pt = this.svgPoint(event);
      this.selectionRect = {
        x: Math.min(pt.x, this.selectionStart.x),
        y: Math.min(pt.y, this.selectionStart.y),
        width: Math.abs(pt.x - this.selectionStart.x),
        height: Math.abs(pt.y - this.selectionStart.y),
      };
    }

    if (this.isDrawingEdge) {
      const canvas = this.canvasPoint(event);
      this.liveEdgeEnd = canvas;
    }
  }

  onMouseUp(): void {
    if (this.isSelecting) {
      this.applyRubberBandSelection();
      this.isSelecting = false;
    }
    this.isPanning = false;
    if (this.isDrawingEdge) {
      this.isDrawingEdge = false;
      this.edgeSourceId = null;
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const scaleFactor = event.deltaY < 0 ? 1.1 : 0.9;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    this.service.viewTransform.update(t => {
      const newScale = Math.min(5, Math.max(0.1, t.scale * scaleFactor));
      return {
        x: mouseX - (mouseX - t.x) * (newScale / t.scale),
        y: mouseY - (mouseY - t.y) * (newScale / t.scale),
        scale: newScale,
      };
    });
  }

  startPan(event: MouseEvent): void {
    if ((event.target as Element).closest('.graph-node, .graph-edge, .zoom-controls')) return;
    this.isPanning = true;
    this.panStart = { x: event.clientX, y: event.clientY };
    const t = this.service.viewTransform();
    this.transformAtPanStart = { x: t.x, y: t.y };
  }

  onInspectNode(nodeId: string): void {
    this.service.inspectedNodeId.set(nodeId);
  }

  startEdgeDraw(sourceId: string, portPosition: { x: number; y: number }): void {
    this.isDrawingEdge = true;
    this.edgeSourceId = sourceId;
    this.liveEdgeStart = portPosition;
    this.liveEdgeEnd = portPosition;
  }

  completeEdge(targetNode: NodeModel): void {
    if (!this.isDrawingEdge || !this.edgeSourceId) return;
    if (this.edgeSourceId === targetNode.id) {
      this.isDrawingEdge = false;
      this.edgeSourceId = null;
      return;
    }

    const sourceNode = this.service.nodes().find(n => n.id === this.edgeSourceId);

    // Department rule: nodes can only connect within same department
    const sourceDept = (sourceNode?.meta?.['department'] as string) ?? '';
    const targetDept = (targetNode.meta?.['department'] as string) ?? '';
    if (sourceDept && targetDept && sourceDept !== targetDept) {
      this.isDrawingEdge = false;
      this.edgeSourceId = null;
      return;
    }

    let label: string | undefined;

    if (sourceNode?.type === 'ivr') {
      const existingEdges = this.service.edges().filter(e => e.sourceId === this.edgeSourceId);
      if (existingEdges.length >= 10) {
        // IVR max 10 outputs (keys 0-9)
        this.isDrawingEdge = false;
        this.edgeSourceId = null;
        return;
      }
      const usedKeys = new Set(existingEdges.map(e => e.label).filter(Boolean));
      const allKeys = ['0','1','2','3','4','5','6','7','8','9'];
      label = allKeys.find(k => !usedKeys.has(k));
    }

    const edge: EdgeModel = {
      id: crypto.randomUUID(),
      sourceId: this.edgeSourceId,
      targetId: targetNode.id,
      ...(label ? { label } : {}),
    };
    this.service.execute(new AddEdgeCommand(edge));
    this.isDrawingEdge = false;
    this.edgeSourceId = null;
  }

  zoomIn(): void {
    this.service.viewTransform.update(t => ({
      ...t,
      scale: Math.min(5, t.scale * 1.2),
    }));
  }

  zoomOut(): void {
    this.service.viewTransform.update(t => ({
      ...t,
      scale: Math.max(0.1, t.scale * 0.8),
    }));
  }

  fitToScreen(): void {
    const nodes = this.service.nodes();
    if (nodes.length === 0) {
      this.service.viewTransform.set({ x: 40, y: 40, scale: 1 });
      return;
    }
    const host = this.svgRoot?.nativeElement.parentElement;
    const canvasW = host?.clientWidth ?? 800;
    const canvasH = host?.clientHeight ?? 600;
    const padding = 64;
    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + n.width));
    const maxY = Math.max(...nodes.map(n => n.y + n.height));
    const graphW = maxX - minX + padding * 2;
    const graphH = maxY - minY + padding * 2;
    const scale = Math.min(canvasW / graphW, canvasH / graphH, 2);
    this.service.viewTransform.set({
      x: (canvasW - (maxX - minX) * scale) / 2 - minX * scale + padding * scale,
      y: (canvasH - (maxY - minY) * scale) / 2 - minY * scale + padding * scale,
      scale,
    });
  }

  private svgPoint(event: MouseEvent): { x: number; y: number } {
    if (!this.svgRoot?.nativeElement) return { x: 0, y: 0 };
    const rect = this.svgRoot.nativeElement.getBoundingClientRect();
    return this.service.screenToCanvas(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
  }

  private canvasPoint(event: MouseEvent): { x: number; y: number } {
    if (!this.svgRoot?.nativeElement) return { x: 0, y: 0 };
    const rect = this.svgRoot.nativeElement.getBoundingClientRect();
    return this.service.screenToCanvas(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
  }

  private applyRubberBandSelection(): void {
    const r = this.selectionRect;
    if (r.width < 4 && r.height < 4) return;
    const selected = new Set<string>();
    for (const node of this.service.nodes()) {
      if (
        node.x < r.x + r.width &&
        node.x + node.width > r.x &&
        node.y < r.y + r.height &&
        node.y + node.height > r.y
      ) {
        selected.add(node.id);
      }
    }
    this.service.selectedIds.set(selected);
  }
}
