import {
  Component, computed, inject, signal, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphEditorService } from '../../graph-editor.service';
import { Vertex } from '../../models/graph.models';
import { SetDestinationCommand, SetDestinationValue } from '../../commands/set-destination.command';
import { GraphNodeComponent } from '../graph-node/graph-node.component';
import { GraphEdgeComponent } from '../graph-edge/graph-edge.component';
import { TriggerPickerComponent, TriggerOption } from '../trigger-picker/trigger-picker.component';
import {
  DestSlot, buildDestinationFromTarget, triggerColorFor, triggerLabelFor,
} from '../../models/destination';
import { DestinationTrigger, RingGroup } from '../../models/ringGroup';
import { CallQueue } from '../../models/callQueue';
import { Ivr } from '../../models/ivr';
import { DidNumber } from '../../models/didNumber';
import { SipTrunk } from '../../models/sipTrunk';

interface PendingPicker {
  source: Vertex;
  target: Vertex;
  options: TriggerOption[];
  position: { x: number; y: number };
}

@Component({
  selector: 'app-graph-canvas',
  standalone: true,
  imports: [CommonModule, GraphNodeComponent, GraphEdgeComponent, TriggerPickerComponent],
  templateUrl: './graph-canvas.component.html',
  styleUrl: './graph-canvas.component.scss',
})
export class GraphCanvasComponent {
  protected readonly service = inject(GraphEditorService);

  readonly svgTransform = computed(() => {
    const { x, y, scale } = this.service.viewTransform();
    return `translate(${x},${y}) scale(${scale})`;
  });

  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  private transformAtPanStart = { x: 0, y: 0 };

  protected readonly isDrawingEdge = signal(false);
  protected edgeSourceId: string | null = null;
  protected readonly liveEdgeStart = signal({ x: 0, y: 0 });
  protected readonly liveEdgeEnd = signal({ x: 0, y: 0 });

  protected readonly isSelecting = signal(false);
  protected readonly selectionRect = signal({ x: 0, y: 0, width: 0, height: 0 });
  private selectionStart = { x: 0, y: 0 };

  protected readonly pendingPicker = signal<PendingPicker | null>(null);
  protected readonly deptMismatch = signal(false);

  @ViewChild('svgRoot') svgRoot!: ElementRef<SVGSVGElement>;

  onSvgMouseDown(event: MouseEvent): void {
    if ((event.target as Element).closest('.graph-node, .graph-edge')) return;
    this.service.selectedIds.set(new Set());

    const pt = this.svgPoint(event);
    this.selectionStart = pt;
    this.selectionRect.set({ x: pt.x, y: pt.y, width: 0, height: 0 });
    this.isSelecting.set(true);
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

    if (this.isSelecting()) {
      const pt = this.svgPoint(event);
      this.selectionRect.set({
        x: Math.min(pt.x, this.selectionStart.x),
        y: Math.min(pt.y, this.selectionStart.y),
        width: Math.abs(pt.x - this.selectionStart.x),
        height: Math.abs(pt.y - this.selectionStart.y),
      });
    }

    if (this.isDrawingEdge()) {
      this.liveEdgeEnd.set(this.canvasPoint(event));
    }
  }

  onMouseUp(): void {
    if (this.isSelecting()) {
      this.applyRubberBandSelection();
      this.isSelecting.set(false);
    }
    this.isPanning = false;
    if (this.isDrawingEdge()) {
      this.isDrawingEdge.set(false);
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
    if ((event.target as Element).closest('.graph-node, .graph-edge, .zoom-controls, .trigger-picker')) return;
    this.isPanning = true;
    this.panStart = { x: event.clientX, y: event.clientY };
    const t = this.service.viewTransform();
    this.transformAtPanStart = { x: t.x, y: t.y };
  }

  onInspectNode(nodeId: string): void {
    this.service.inspectedNodeId.set(nodeId);
  }

  startEdgeDraw(sourceId: string, portPosition: { x: number; y: number }): void {
    this.isDrawingEdge.set(true);
    this.edgeSourceId = sourceId;
    this.liveEdgeStart.set(portPosition);
    this.liveEdgeEnd.set(portPosition);
  }

  completeEdge(targetNode: Vertex): void {
    if (!this.isDrawingEdge() || !this.edgeSourceId) return;
    const sourceNode = this.service.nodes().find(n => n.id === this.edgeSourceId);
    if (!sourceNode || sourceNode.id === targetNode.id) { this.cancelDraw(); return; }

    const sourceDept = nodeDept(sourceNode);
    const targetDept = nodeDept(targetNode);
    if (sourceDept && targetDept && sourceDept !== targetDept) {
      this.flashDeptMismatch();
      this.cancelDraw();
      return;
    }

    const opts = this.optionsForSource(sourceNode);
    if (opts.length === 0) { this.cancelDraw(); return; }

    this.pendingPicker.set({
      source: sourceNode,
      target: targetNode,
      options: opts,
      position: this.endpointToScreen(this.liveEdgeEnd()),
    });
    this.cancelDraw();
  }

  onTriggerPicked(optionValue: string): void {
    const ctx = this.pendingPicker();
    if (!ctx) return;
    this.pendingPicker.set(null);
    const slot = parseSlotValue(optionValue);
    const next = this.buildSetValue(slot, ctx.target);
    this.service.execute(new SetDestinationCommand(ctx.source.id, slot, next));
  }

  onTriggerCancel(): void {
    this.pendingPicker.set(null);
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

  // ---------------------------------------------------------------------

  private cancelDraw(): void {
    this.isDrawingEdge.set(false);
    this.edgeSourceId = null;
  }

  private flashDeptMismatch(): void {
    this.deptMismatch.set(true);
    setTimeout(() => this.deptMismatch.set(false), 1500);
  }

  private optionsForSource(n: Vertex): TriggerOption[] {
    switch (n.type) {
      case 'ring-group':
      case 'call-queue': return this.rgCqOptions(n);
      case 'ivr':        return this.ivrOptions(n);
      case 'did':        return this.didOptions(n);
      case 'sip-trunk':  return this.sipTrunkOptions(n);
      default: return [];
    }
  }

  private rgCqOptions(n: Vertex): TriggerOption[] {
    const data = n.data as RingGroup | CallQueue;
    const usedTriggers = new Set(this.usedDestinationTriggers([data.destinationNoAnswer, data.destinationOfficeClosed, data.destinationBreak, data.destinationHoliday]));
    return this.triggerOptions([DestinationTrigger.NO_ANSWER, DestinationTrigger.OFFICE_CLOSED, DestinationTrigger.BREAK, DestinationTrigger.HOLIDAY], n.type, usedTriggers);
  }

  private ivrOptions(n: Vertex): TriggerOption[] {
    const ivr = n.data as Ivr;
    const usedTriggers = new Set(this.usedDestinationTriggers([ivr.destinationOfficeClosed, ivr.destinationBreak, ivr.destinationHoliday]));
    const dest = this.triggerOptions([DestinationTrigger.OFFICE_CLOSED, DestinationTrigger.BREAK, DestinationTrigger.HOLIDAY], n.type, usedTriggers);
    const usedDigits = new Set((ivr.forwards ?? []).map(f => f.input));
    const forwards: TriggerOption[] = ['0','1','2','3','4','5','6','7','8','9'].map(d => ({
      value: `fwd:${d}`, label: `Key ${d}`, color: triggerColorFor('FORWARD'),
      group: 'forwards', inUse: usedDigits.has(d),
    }));
    const fallbacks: TriggerOption[] = [
      { value: 'timeout', label: 'Timeout', color: triggerColorFor('TIMEOUT'),
        group: 'fallbacks', inUse: !!ivr.timeoutDestination },
      { value: 'invalidkey', label: 'Invalid Key', color: triggerColorFor('INVALID_KEY'),
        group: 'fallbacks', inUse: !!ivr.invalidKeyDestination },
    ];
    return [...dest, ...forwards, ...fallbacks];
  }

  private didOptions(n: Vertex): TriggerOption[] {
    const d = n.data as DidNumber;
    const usedTriggers = new Set(this.usedDestinationTriggers([d.destinationOfficeHours, d.destinationOfficeClosed, d.destinationHoliday]));
    return this.triggerOptions([DestinationTrigger.DEFAULT_ROUTE, DestinationTrigger.OFFICE_CLOSED, DestinationTrigger.HOLIDAY], n.type, usedTriggers);
  }

  private sipTrunkOptions(n: Vertex): TriggerOption[] {
    const t = n.data as SipTrunk;
    const used = new Set(this.usedDestinationTriggers([t.defaultRoute]));
    return this.triggerOptions([DestinationTrigger.DEFAULT_ROUTE], n.type, used);
  }

  private triggerOptions(triggers: DestinationTrigger[], sourceType: Vertex['type'], used: Set<string>): TriggerOption[] {
    return triggers.map(t => ({
      value: `dest:${t}`,
      label: triggerLabelFor(sourceType, t),
      color: triggerColorFor(t),
      group: 'destinations',
      inUse: used.has(t),
    }));
  }

  private usedDestinationTriggers(dests: Array<{ trigger: DestinationTrigger; toValue: string | null } | undefined>): string[] {
    return dests.filter(d => d && d.toValue && d.toValue !== 'None').map(d => d!.trigger);
  }

  private buildSetValue(slot: DestSlot, target: Vertex): SetDestinationValue {
    if (slot.kind === 'destination') {
      const fields = buildDestinationFromTarget(target, slot.trigger);
      return { kind: 'fields', fields };
    }
    if (slot.kind === 'forward') {
      const destString = legacyStringFor(target);
      return { kind: 'forward-destination', destination: destString, forwardType: forwardTypeFor(target) };
    }
    if (slot.kind === 'timeout') {
      return { kind: 'timeout-string', value: legacyStringFor(target) };
    }
    return { kind: 'invalidkey-string', value: legacyStringFor(target) };
  }

  private endpointToScreen(canvasPoint: { x: number; y: number }): { x: number; y: number } {
    const { x, y, scale } = this.service.viewTransform();
    const host = this.svgRoot?.nativeElement.parentElement;
    const rect = host?.getBoundingClientRect();
    const offsetX = rect?.left ?? 0;
    const offsetY = rect?.top ?? 0;
    return { x: canvasPoint.x * scale + x + offsetX, y: canvasPoint.y * scale + y + offsetY };
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
    return this.svgPoint(event);
  }

  private applyRubberBandSelection(): void {
    const r = this.selectionRect();
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

// ---------------------------------------------------------------------------

function parseSlotValue(s: string): DestSlot {
  if (s === 'timeout') return { kind: 'timeout' };
  if (s === 'invalidkey') return { kind: 'invalidkey' };
  const [kind, key] = s.split(':');
  if (kind === 'fwd') return { kind: 'forward', digit: key };
  return { kind: 'destination', trigger: key as DestinationTrigger };
}

function nodeDept(n: Vertex): string {
  const d = n.data as { departmentName?: string | null } | undefined;
  return d?.departmentName ?? '';
}

function legacyStringFor(target: Vertex): string {
  const data: any = target.data ?? {};
  switch (target.type) {
    case 'extension':       return `Extension:${data.num ?? ''}`;
    case 'ring-group':
    case 'call-queue':
    case 'ivr':             return `Extension:${data.extensionNumber ?? ''}`;
    case 'voicemail':       return `VoiceMail:${data.extensionNumber ?? ''}`;
    case 'call-processing-script': return `VoiceApp:${data.name ?? ''}`;
    case 'external-number': return `External:${data.number ?? ''}`;
    case 'end-call':        return 'None';
    case 'accept-anyway':   return 'ProceedWithNoExceptions';
    default: return '';
  }
}

function forwardTypeFor(target: Vertex): string {
  switch (target.type) {
    case 'extension':       return 'extension';
    case 'ring-group':      return 'ringgroup';
    case 'call-queue':      return 'queue';
    case 'ivr':             return 'ivr';
    case 'voicemail':       return 'voicemail';
    case 'call-processing-script': return 'voiceapp';
    case 'external-number': return 'external';
    default: return 'extension';
  }
}
