import { Component, inject, signal } from '@angular/core';
import { GraphEditorComponent, Graph } from './graph-editor';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GraphEditorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly themeService = inject(ThemeService);
  graph = signal<Graph>(this.buildTestData());

  onGraphChange(g: Graph): void {
    this.graph.set(g);
  }

  private buildTestData(): Graph {
    const nodes = [
      // === FLOW 1: Sales Inbound (Sales dept) ===
      // SIP Trunk → DID → IVR → RG / CQ → Extensions
      {
        id: 'trunk-1',
        type: 'sip-trunk' as const,
        label: 'Comcast SIP',
        x: 40,
        y: 80,
        width: 160,
        height: 59,
        meta: { department: 'Sales' },
      },
      {
        id: 'did-1',
        type: 'did' as const,
        label: '(800) 555-0100',
        x: 280,
        y: 80,
        width: 160,
        height: 59,
        meta: { department: 'Sales' },
      },
      {
        id: 'ivr-1',
        type: 'ivr' as const,
        label: 'Sales Menu',
        x: 520,
        y: 80,
        width: 160,
        height: 75,
        meta: { department: 'Sales', extensionNumber: '800' },
      },
      {
        id: 'rg-1',
        type: 'ring-group' as const,
        label: 'Sales Floor',
        x: 780,
        y: 10,
        width: 160,
        height: 75,
        meta: { department: 'Sales', extensionNumber: '801', members: ['100', '101', '102'] },
      },
      {
        id: 'cq-1',
        type: 'call-queue' as const,
        label: 'Sales Overflow',
        x: 780,
        y: 160,
        width: 160,
        height: 75,
        meta: { department: 'Sales', extensionNumber: '802', members: ['100', '103'] },
      },
      {
        id: 'ext-100',
        type: 'extension' as const,
        label: '100 - John Smith',
        x: 1040,
        y: 0,
        width: 160,
        height: 75,
        meta: { extensionNumber: '100', firstName: 'John', lastName: 'Smith', department: 'Sales' },
      },
      {
        id: 'ext-101',
        type: 'extension' as const,
        label: '101 - Jane Doe',
        x: 1040,
        y: 90,
        width: 160,
        height: 75,
        meta: { extensionNumber: '101', firstName: 'Jane', lastName: 'Doe', department: 'Sales' },
      },
      {
        id: 'ext-102',
        type: 'extension' as const,
        label: '102 - Mike Johnson',
        x: 1040,
        y: 180,
        width: 160,
        height: 75,
        meta: {
          extensionNumber: '102',
          firstName: 'Mike',
          lastName: 'Johnson',
          department: 'Sales',
        },
      },
      {
        id: 'ext-103',
        type: 'extension' as const,
        label: '103 - Sarah Williams',
        x: 1040,
        y: 270,
        width: 160,
        height: 75,
        meta: {
          extensionNumber: '103',
          firstName: 'Sarah',
          lastName: 'Williams',
          department: 'Sales',
        },
      },

      // === FLOW 2: Sales After-Hours (Sales dept — same department as Flow 1) ===
      // SIP Trunk → DID → CQ → Extensions
      {
        id: 'trunk-2',
        type: 'sip-trunk' as const,
        label: 'AT&T SIP',
        x: 40,
        y: 450,
        width: 160,
        height: 59,
        meta: { department: 'Sales' },
      },
      {
        id: 'did-2',
        type: 'did' as const,
        label: '(800) 555-0101',
        x: 280,
        y: 450,
        width: 160,
        height: 59,
        meta: { department: 'Sales' },
      },
      {
        id: 'cq-2',
        type: 'call-queue' as const,
        label: 'After-Hours Sales',
        x: 520,
        y: 450,
        width: 160,
        height: 75,
        meta: { department: 'Sales', extensionNumber: '803', members: ['103', '104'] },
      },
      {
        id: 'ext-104',
        type: 'extension' as const,
        label: '104 - David Brown',
        x: 780,
        y: 420,
        width: 160,
        height: 75,
        meta: {
          extensionNumber: '104',
          firstName: 'David',
          lastName: 'Brown',
          department: 'Sales',
        },
      },

      // === FLOW 3: Technical Support (Support dept) ===
      // SIP Trunk → DID → IVR → RG (Tier 1) / CQ (Tier 2) → Extensions
      {
        id: 'trunk-3',
        type: 'sip-trunk' as const,
        label: 'Lumen SIP',
        x: 40,
        y: 700,
        width: 160,
        height: 59,
        meta: { department: 'Support' },
      },
      {
        id: 'did-3',
        type: 'did' as const,
        label: '(800) 555-0200',
        x: 280,
        y: 700,
        width: 160,
        height: 59,
        meta: { department: 'Support' },
      },
      {
        id: 'ivr-2',
        type: 'ivr' as const,
        label: 'Support Menu',
        x: 520,
        y: 700,
        width: 160,
        height: 75,
        meta: { department: 'Support', extensionNumber: '810' },
      },
      {
        id: 'rg-2',
        type: 'ring-group' as const,
        label: 'Tier 1 Support',
        x: 780,
        y: 630,
        width: 160,
        height: 75,
        meta: { department: 'Support', extensionNumber: '811', members: ['105', '106', '107'] },
      },
      {
        id: 'cq-3',
        type: 'call-queue' as const,
        label: 'Tier 2 Escalation',
        x: 780,
        y: 780,
        width: 160,
        height: 75,
        meta: { department: 'Support', extensionNumber: '812', members: ['108', '109'] },
      },
      {
        id: 'ext-105',
        type: 'extension' as const,
        label: '105 - Emily Davis',
        x: 1040,
        y: 580,
        width: 160,
        height: 75,
        meta: {
          extensionNumber: '105',
          firstName: 'Emily',
          lastName: 'Davis',
          department: 'Support',
        },
      },
      {
        id: 'ext-106',
        type: 'extension' as const,
        label: '106 - Chris Miller',
        x: 1040,
        y: 670,
        width: 160,
        height: 75,
        meta: {
          extensionNumber: '106',
          firstName: 'Chris',
          lastName: 'Miller',
          department: 'Support',
        },
      },
      {
        id: 'ext-107',
        type: 'extension' as const,
        label: '107 - Lisa Wilson',
        x: 1040,
        y: 760,
        width: 160,
        height: 75,
        meta: {
          extensionNumber: '107',
          firstName: 'Lisa',
          lastName: 'Wilson',
          department: 'Support',
        },
      },
      {
        id: 'ext-108',
        type: 'extension' as const,
        label: '108 - Tom Moore',
        x: 1040,
        y: 850,
        width: 160,
        height: 75,
        meta: {
          extensionNumber: '108',
          firstName: 'Tom',
          lastName: 'Moore',
          department: 'Support',
        },
      },
      {
        id: 'ext-109',
        type: 'extension' as const,
        label: '109 - Amy Taylor',
        x: 1040,
        y: 940,
        width: 160,
        height: 75,
        meta: {
          extensionNumber: '109',
          firstName: 'Amy',
          lastName: 'Taylor',
          department: 'Support',
        },
      },
    ];

    const edges = [
      // Flow 1: Sales Inbound
      { id: 'e1', sourceId: 'trunk-1', targetId: 'did-1' },
      { id: 'e2', sourceId: 'did-1', targetId: 'ivr-1' },
      { id: 'e3', sourceId: 'ivr-1', targetId: 'rg-1', label: '1' },
      { id: 'e4', sourceId: 'ivr-1', targetId: 'cq-1', label: '2' },
      { id: 'e5', sourceId: 'rg-1', targetId: 'ext-100' },
      { id: 'e6', sourceId: 'rg-1', targetId: 'ext-101' },
      { id: 'e7', sourceId: 'rg-1', targetId: 'ext-102' },
      { id: 'e8', sourceId: 'cq-1', targetId: 'ext-100' },
      { id: 'e9', sourceId: 'cq-1', targetId: 'ext-103' },

      // Flow 2: Sales After-Hours
      { id: 'e10', sourceId: 'trunk-2', targetId: 'did-2' },
      { id: 'e11', sourceId: 'did-2', targetId: 'cq-2' },
      { id: 'e12', sourceId: 'cq-2', targetId: 'ext-103' },
      { id: 'e13', sourceId: 'cq-2', targetId: 'ext-104' },

      // Flow 3: Support
      { id: 'e14', sourceId: 'trunk-3', targetId: 'did-3' },
      { id: 'e15', sourceId: 'did-3', targetId: 'ivr-2' },
      { id: 'e16', sourceId: 'ivr-2', targetId: 'rg-2', label: '1' },
      { id: 'e17', sourceId: 'ivr-2', targetId: 'cq-3', label: '2' },
      { id: 'e18', sourceId: 'rg-2', targetId: 'ext-105' },
      { id: 'e19', sourceId: 'rg-2', targetId: 'ext-106' },
      { id: 'e20', sourceId: 'rg-2', targetId: 'ext-107' },
      { id: 'e21', sourceId: 'cq-3', targetId: 'ext-108' },
      { id: 'e22', sourceId: 'cq-3', targetId: 'ext-109' },
    ];

    return { nodes, edges };
  }
}
