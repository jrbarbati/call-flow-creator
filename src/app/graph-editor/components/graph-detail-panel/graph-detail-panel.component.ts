import { Component, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GraphEditorService } from '../../graph-editor.service';
import { NODE_TYPE_CONFIGS, EXTENSIONS } from '../../models/node-types';
import { RenameNodeCommand } from '../../commands/rename-node.command';
import { UpdateNodeMetaCommand } from '../../commands/update-node-meta.command';

@Component({
  selector: 'app-graph-detail-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './graph-detail-panel.component.html',
  styleUrl: './graph-detail-panel.component.scss',
})
export class GraphDetailPanelComponent {
  protected readonly service = inject(GraphEditorService);
  protected readonly extensions = EXTENSIONS;

  protected readonly node = computed(() => this.service.inspectedNode());

  protected readonly typeConfig = computed(() => {
    const n = this.node();
    if (!n) return null;
    return NODE_TYPE_CONFIGS[n.type] ?? null;
  });

  protected readonly forwards = computed(() => {
    const n = this.node();
    if (!n || n.type !== 'ivr') return [];
    const edges = this.service.edges().filter(e => e.sourceId === n.id);
    const nodes = this.service.nodes();
    return edges.map(e => {
      const target = nodes.find(nd => nd.id === e.targetId);
      return { key: e.label ?? '?', targetLabel: target?.label ?? 'Unknown' };
    });
  });

  protected readonly members = computed(() => {
    const n = this.node();
    if (!n) return [];
    const memberIds: string[] = (n.meta?.['members'] as string[]) ?? [];
    return memberIds;
  });

  close(): void {
    this.service.inspectedNodeId.set(null);
  }

  onLabelChange(value: string): void {
    const n = this.node();
    if (!n || value === n.label) return;
    this.service.execute(new RenameNodeCommand(n.id, n.label, value));
  }

  onMetaFieldChange(field: string, value: string): void {
    const n = this.node();
    if (!n) return;
    const oldMeta = { ...(n.meta ?? {}) };
    const newMeta = { ...oldMeta, [field]: value };
    this.service.execute(new UpdateNodeMetaCommand(n.id, oldMeta, newMeta));
  }

  toggleMember(extNumber: string): void {
    const n = this.node();
    if (!n) return;
    const oldMeta = { ...(n.meta ?? {}) };
    const currentMembers: string[] = [...((oldMeta['members'] as string[]) ?? [])];
    const idx = currentMembers.indexOf(extNumber);
    if (idx >= 0) {
      currentMembers.splice(idx, 1);
    } else {
      currentMembers.push(extNumber);
    }
    const newMeta = { ...oldMeta, members: currentMembers };
    this.service.execute(new UpdateNodeMetaCommand(n.id, oldMeta, newMeta));
  }

  isMember(extNumber: string): boolean {
    const m = this.members();
    return m.includes(extNumber);
  }
}
