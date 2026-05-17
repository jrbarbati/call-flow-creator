import { Component, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GraphEditorService } from '../../graph-editor.service';
import { NODE_TYPE_CONFIGS, EXTENSIONS } from '../../models/node-types';
import { EDIT_COMPONENT_FOR_TYPE } from '../../models/edit-registry';
import { RenameNodeCommand } from '../../commands/rename-node.command';
import { UpdateNodeDataCommand } from '../../commands/update-node-data.command';
import { ModalService } from '../../services/modal.service';
import { createDefaultNodeData } from '../../models/node-data.factory';
import { NodeData } from '../../models/node-data';
import { Vertex } from '../../models/graph.models';
import { RingGroup, DestinationTrigger } from '../../models/ringGroup';
import { CallQueue } from '../../models/callQueue';
import { Ivr, IvrForward } from '../../models/ivr';
import { DidNumber } from '../../models/didNumber';
import { SipTrunk } from '../../models/sipTrunk';
import { AnyDestination, formatDestination, triggerLabelFor } from '../../models/destination';

interface DestRow { trigger: DestinationTrigger; label: string; value: string; }

@Component({
  selector: 'app-graph-detail-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './graph-detail-panel.component.html',
  styleUrl: './graph-detail-panel.component.scss',
})
export class GraphDetailPanelComponent {
  protected readonly service = inject(GraphEditorService);
  private readonly modal = inject(ModalService);
  protected readonly extensions = EXTENSIONS;

  protected readonly node = computed(() => this.service.inspectedNode());

  protected readonly typeConfig = computed(() => {
    const n = this.node();
    if (!n) return null;
    return NODE_TYPE_CONFIGS[n.type] ?? null;
  });

  protected readonly destinationRows = computed<DestRow[]>(() => {
    const n = this.node();
    if (!n || !n.data) return [];
    return destinationRowsForNode(n);
  });

  protected readonly forwards = computed<IvrForward[]>(() => {
    const n = this.node();
    if (!n || n.type !== 'ivr' || !n.data) return [];
    return (n.data as Ivr).forwards ?? [];
  });

  protected readonly canEdit = computed(() => {
    const n = this.node();
    if (!n) return false;
    return EDIT_COMPONENT_FOR_TYPE[n.type] != null;
  });

  protected readonly extensionNumber = computed(() => {
    const n = this.node();
    if (!n || !n.data) return '';
    const d = n.data as { extensionNumber?: string; num?: string };
    return d.extensionNumber ?? d.num ?? '';
  });

  protected readonly departmentName = computed(() => {
    const n = this.node();
    if (!n || !n.data) return '';
    return (n.data as { departmentName?: string | null }).departmentName ?? '';
  });

  close(): void {
    this.service.inspectedNodeId.set(null);
  }

  onLabelChange(value: string): void {
    const n = this.node();
    if (!n || value === n.label) return;
    this.service.execute(new RenameNodeCommand(n.id, n.label, value));
  }

  onExtensionNumberChange(value: string): void {
    const n = this.node();
    if (!n || !n.data) return;
    const data = { ...n.data } as Record<string, unknown>;
    if ('extensionNumber' in data) data['extensionNumber'] = value;
    if ('num' in data) data['num'] = value;
    this.service.execute(new UpdateNodeDataCommand(n.id, n.data, data as unknown as NodeData));
  }

  onDepartmentNameChange(value: string): void {
    const n = this.node();
    if (!n || !n.data) return;
    const data = { ...n.data } as Record<string, unknown>;
    if ('departmentName' in data) data['departmentName'] = value;
    this.service.execute(new UpdateNodeDataCommand(n.id, n.data, data as unknown as NodeData));
  }

  async onEdit(): Promise<void> {
    const n = this.node();
    if (!n) return;
    const editComponent = EDIT_COMPONENT_FOR_TYPE[n.type];
    if (!editComponent) return;

    const seed = n.data ?? createDefaultNodeData(n.type, {
      label: n.label,
      extensionNumber: n.meta?.['extensionNumber'] as string | undefined,
      firstName: n.meta?.['firstName'] as string | undefined,
      lastName: n.meta?.['lastName'] as string | undefined,
    });
    const draft = structuredClone(seed) as NodeData;

    const result = await this.modal.open<NodeData, NodeData>(editComponent, draft);
    if (!result) return;
    this.service.execute(new UpdateNodeDataCommand(n.id, n.data, result));
  }
}

// ---------------------------------------------------------------------------

function destinationRowsForNode(n: Vertex): DestRow[] {
  const data = n.data;
  if (!data) return [];
  switch (n.type) {
    case 'ring-group':
    case 'call-queue': {
      const d = data as RingGroup | CallQueue;
      return [
        { trigger: DestinationTrigger.NO_ANSWER,     label: 'No Answer',     value: formatDestination(d.destinationNoAnswer) },
        { trigger: DestinationTrigger.OFFICE_CLOSED, label: 'Office Closed', value: formatDestination(d.destinationOfficeClosed) },
        { trigger: DestinationTrigger.BREAK,         label: 'Break',         value: formatDestination(d.destinationBreak) },
        { trigger: DestinationTrigger.HOLIDAY,       label: 'Holiday',       value: formatDestination(d.destinationHoliday) },
      ];
    }
    case 'ivr': {
      const i = data as Ivr;
      const rows: DestRow[] = [
        { trigger: DestinationTrigger.OFFICE_CLOSED, label: 'Office Closed', value: formatDestination(i.destinationOfficeClosed) },
        { trigger: DestinationTrigger.BREAK,         label: 'Break',         value: formatDestination(i.destinationBreak) },
        { trigger: DestinationTrigger.HOLIDAY,       label: 'Holiday',       value: formatDestination(i.destinationHoliday) },
      ];
      if (i.timeoutDestination) rows.push({ trigger: DestinationTrigger.NO_ANSWER, label: 'Timeout', value: i.timeoutDestination });
      if (i.invalidKeyDestination) rows.push({ trigger: DestinationTrigger.NO_ANSWER, label: 'Invalid Key', value: i.invalidKeyDestination });
      return rows;
    }
    case 'did': {
      const d = data as DidNumber;
      return [
        { trigger: DestinationTrigger.DEFAULT_ROUTE, label: triggerLabelFor('did', DestinationTrigger.DEFAULT_ROUTE), value: formatDestination(d.destinationOfficeHours) },
        { trigger: DestinationTrigger.OFFICE_CLOSED, label: 'Office Closed', value: formatDestination(d.destinationOfficeClosed) },
        { trigger: DestinationTrigger.HOLIDAY,       label: 'Holiday',       value: formatDestination(d.destinationHoliday) },
      ];
    }
    case 'sip-trunk': {
      const t = data as SipTrunk;
      return [
        { trigger: DestinationTrigger.DEFAULT_ROUTE, label: triggerLabelFor('sip-trunk', DestinationTrigger.DEFAULT_ROUTE), value: formatDestination(t.defaultRoute) },
      ];
    }
    default: return [];
  }
}
