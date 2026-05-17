import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GraphEditorService } from '../../graph-editor.service';

interface FilterConfig {
  type: string;
  label: string;
}

@Component({
  selector: 'app-graph-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './graph-filter-bar.component.html',
  styleUrl: './graph-filter-bar.component.scss',
})
export class GraphFilterBarComponent {
  protected readonly service = inject(GraphEditorService);
  protected readonly isExpanded = signal(false);

  protected readonly filterConfigs: FilterConfig[] = [
    { type: 'did', label: 'DID' },
    { type: 'ivr', label: 'IVR' },
    { type: 'ring-group', label: 'Ring Group' },
    { type: 'call-queue', label: 'Call Queue' },
    { type: 'extension', label: 'Extension' },
  ];

  protected readonly searchText = signal<Record<string, string>>({});
  protected readonly showDropdown = signal<Record<string, boolean>>({});
  protected readonly departmentSearch = signal('');
  protected readonly showDeptDropdown = signal(false);

  protected readonly activeFilterCount = computed(() => {
    const byType = this.service.filterByType();
    const byDept = this.service.filterByDepartment();
    let count = byDept.length;
    for (const ids of Object.values(byType)) count += ids.length;
    return count;
  });

  protected readonly allDepartments = computed(() => {
    const depts = new Set<string>();
    for (const n of this.service.nodes()) {
      const d = (n.data as { departmentName?: string | null } | undefined)?.departmentName ?? '';
      if (d) depts.add(d);
    }
    return [...depts].sort();
  });

  protected filteredDepartments = computed(() => {
    const search = this.departmentSearch().toLowerCase();
    const all = this.allDepartments();
    if (!search) return all;
    return all.filter((d) => d.toLowerCase().includes(search));
  });

  getNodesForType(type: string) {
    return this.service.nodes().filter((n) => n.type === type);
  }

  getFilteredNodes(type: string) {
    const search = (this.searchText()[type] ?? '').toLowerCase();
    const nodes = this.getNodesForType(type);
    if (!search) return nodes;
    return nodes.filter((n) => {
      const label = n.label.toLowerCase();
      const data = n.data as { extensionNumber?: string; num?: string } | undefined;
      const ext = (data?.extensionNumber ?? data?.num ?? '').toLowerCase();
      return label.includes(search) || ext.includes(search);
    });
  }

  setSearchText(type: string, value: string): void {
    this.searchText.update(s => ({ ...s, [type]: value }));
  }

  getSelectedIds(type: string): string[] {
    return this.service.filterByType()[type] ?? [];
  }

  isNodeSelected(type: string, nodeId: string): boolean {
    return this.getSelectedIds(type).includes(nodeId);
  }

  toggleNode(type: string, nodeId: string): void {
    const current = [...this.getSelectedIds(type)];
    const idx = current.indexOf(nodeId);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(nodeId);
    }
    this.service.setTypeFilter(type, current);
  }

  removeNode(type: string, nodeId: string): void {
    const current = this.getSelectedIds(type).filter((id) => id !== nodeId);
    this.service.setTypeFilter(type, current);
  }

  getNodeLabel(nodeId: string): string {
    return this.service.nodes().find((n) => n.id === nodeId)?.label ?? '';
  }

  isDeptSelected(dept: string): boolean {
    return this.service.filterByDepartment().includes(dept);
  }

  toggleDepartment(dept: string): void {
    const current = [...this.service.filterByDepartment()];
    const idx = current.indexOf(dept);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(dept);
    }
    this.service.filterByDepartment.set(current);
  }

  removeDepartment(dept: string): void {
    this.service.filterByDepartment.update((d) => d.filter((x) => x !== dept));
  }

  toggleExpanded(): void {
    this.isExpanded.update(v => !v);
  }

  clearAll(): void {
    this.service.clearFilters();
    this.searchText.set({});
    this.departmentSearch.set('');
  }

  openDropdown(key: string): void {
    this.showDropdown.update(s => ({ ...s, [key]: true }));
  }

  closeDropdown(key: string): void {
    setTimeout(() => {
      this.showDropdown.update(s => ({ ...s, [key]: false }));
    }, 150);
  }

  openDeptDropdown(): void {
    this.showDeptDropdown.set(true);
  }

  closeDeptDropdown(): void {
    setTimeout(() => {
      this.showDeptDropdown.set(false);
    }, 150);
  }
}
