import { Component, inject, signal } from '@angular/core';
import { GraphEditorComponent, Graph, Vertex } from './graph-editor';
import { ThemeService } from './theme.service';
import { createDefaultNodeData } from './graph-editor/models/node-data.factory';
import { RingGroup, RingGroupMember } from './graph-editor/models/ringGroup';
import { CallQueue, CallQueueAgent } from './graph-editor/models/callQueue';
import { Ivr, IvrForward } from './graph-editor/models/ivr';
import { DidNumber } from './graph-editor/models/didNumber';
import { SipTrunk } from './graph-editor/models/sipTrunk';
import { Extension } from './graph-editor/models/extension';

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

  // ---------------------------------------------------------------------------
  // Fake setup
  //
  // Modeled after a real PBX:
  //   - A SIP Trunk has a main `externalNumber` (its primary DID) and a list of
  //     `didNumbers` assigned to the trunk. The trunk fans out to a DID node for
  //     each assigned number.
  //   - Each DID may set its own `destinationOfficeHours`. When that slot is
  //     empty (null/undefined or a placeholder with no toValue and no target),
  //     the DID inherits the trunk's `defaultRoute` for office hours.
  //   - IVRs use menu `forwards` plus officeClosed/Break/Holiday destinations.
  //   - RG/CQ use noAnswer / officeClosed / Break / Holiday destinations.
  //
  // Edges are derived from these typed fields by EdgeDerivationService.
  // ---------------------------------------------------------------------------
  private buildTestData(): Graph {
    const nodes: Vertex[] = [];

    // === Sales department =====================================================
    nodes.push(sipTrunk('trunk-sales', 'Comcast SIP', 40, 110, 'Sales', {
      externalNumber: '+18005550100',
      didNumbers:     ['+18005550100', '+18005550150', '+18005550151'],
      defaultRouteExt: '800', // every DID without its own routing → Sales Menu IVR
    }));

    // Main trunk number — inherits trunk default route.
    nodes.push(did('did-sales-main',   '+18005550100', 280,  30, 'Sales',
      { sipTrunkName: 'Comcast SIP' }));
    // Additional trunk DIDs — one inherits, one overrides to a direct extension.
    nodes.push(did('did-sales-general', '+18005550150', 280, 110, 'Sales',
      { sipTrunkName: 'Comcast SIP' }));
    nodes.push(did('did-sales-jane',    '+18005550151', 280, 190, 'Sales',
      { sipTrunkName: 'Comcast SIP', officeHoursExt: '101' })); // direct-dial to Jane

    nodes.push(ivr('ivr-sales', 'Sales Menu', 540, 110, 'Sales', '800', [
      { key: '1', extensionNumber: '801' }, // Sales Floor RG
      { key: '2', extensionNumber: '802' }, // Sales Overflow CQ
    ]));

    nodes.push(ringGroup('rg-sales', 'Sales Floor', 800, 30, 'Sales', '801',
      [m('100', 'John Smith'), m('101', 'Jane Doe'), m('102', 'Mike Johnson')],
      { noAnswerExt: '802' }, // overflow → CQ
    ));

    nodes.push(callQueue('cq-sales', 'Sales Overflow', 800, 160, 'Sales', '802',
      [a('100', 'John Smith'), a('103', 'Sarah Williams')],
      { noAnswerExt: '100' },
    ));

    nodes.push(extension('ext-100', '100', 'John',  'Smith',    'Sales', 1060,   0));
    nodes.push(extension('ext-101', '101', 'Jane',  'Doe',      'Sales', 1060,  90));
    nodes.push(extension('ext-102', '102', 'Mike',  'Johnson',  'Sales', 1060, 180));
    nodes.push(extension('ext-103', '103', 'Sarah', 'Williams', 'Sales', 1060, 270));

    // === Support department ===================================================
    nodes.push(sipTrunk('trunk-support', 'Lumen SIP', 40, 600, 'Support', {
      externalNumber: '+18005550200',
      didNumbers:     ['+18005550200', '+18005550250'],
      defaultRouteExt: '810', // every DID without its own routing → Support Menu IVR
    }));

    nodes.push(did('did-support-main',    '+18005550200', 280, 540, 'Support',
      { sipTrunkName: 'Lumen SIP' }));
    nodes.push(did('did-support-hotline', '+18005550250', 280, 620, 'Support',
      { sipTrunkName: 'Lumen SIP', officeHoursExt: '812' })); // direct hotline → Tier 2

    nodes.push(ivr('ivr-support', 'Support Menu', 540, 600, 'Support', '810', [
      { key: '1', extensionNumber: '811' }, // Tier 1 RG
      { key: '2', extensionNumber: '812' }, // Tier 2 CQ
    ]));

    nodes.push(ringGroup('rg-tier1', 'Tier 1 Support', 800, 510, 'Support', '811',
      [m('105', 'Emily Davis'), m('106', 'Chris Miller'), m('107', 'Lisa Wilson')],
      { noAnswerExt: '812' }, // escalate → Tier 2
    ));

    nodes.push(callQueue('cq-tier2', 'Tier 2 Escalation', 800, 650, 'Support', '812',
      [a('108', 'Tom Moore'), a('109', 'Amy Taylor')],
      { noAnswerExt: '108' },
    ));

    nodes.push(extension('ext-105', '105', 'Emily', 'Davis',  'Support', 1060, 480));
    nodes.push(extension('ext-106', '106', 'Chris', 'Miller', 'Support', 1060, 570));
    nodes.push(extension('ext-107', '107', 'Lisa',  'Wilson', 'Support', 1060, 660));
    nodes.push(extension('ext-108', '108', 'Tom',   'Moore',  'Support', 1060, 750));
    nodes.push(extension('ext-109', '109', 'Amy',   'Taylor', 'Support', 1060, 840));

    return { nodes };
  }
}

// ---------------------------------------------------------------------------
// Vertex builders — typed node.data, edges derived by EdgeDerivationService.
// ---------------------------------------------------------------------------

interface SipTrunkOpts {
  externalNumber: string;
  didNumbers: string[];
  defaultRouteExt?: string;
}

function sipTrunk(
  id: string, name: string, x: number, y: number, dept: string, opts: SipTrunkOpts,
): Vertex {
  const data = createDefaultNodeData('sip-trunk', { label: name }) as SipTrunk;
  data.externalNumber = opts.externalNumber;
  data.number = opts.externalNumber;
  data.didNumbers = [...opts.didNumbers];
  if (opts.defaultRouteExt) {
    data.defaultRoute.toValue = 'Extension';
    data.defaultRoute.extensionNumber = opts.defaultRouteExt;
    data.defaultRoute.targetType = 'Extension';
  } else {
    clearDestination(data.defaultRoute);
  }
  data.destinations = [data.defaultRoute];
  return vertex(id, 'sip-trunk', name, x, y, false, data, dept);
}

interface DidOpts {
  sipTrunkName?: string;
  officeHoursExt?: string; // when omitted, the DID inherits the trunk's defaultRoute
}

function did(id: string, number: string, x: number, y: number, dept: string, opts: DidOpts = {}): Vertex {
  const data = createDefaultNodeData('did', { label: number }) as DidNumber;
  data.number = number;
  if (opts.officeHoursExt) {
    data.destinationOfficeHours.toValue = 'Extension';
    data.destinationOfficeHours.extensionNumber = opts.officeHoursExt;
    data.destinationOfficeHours.targetType = 'Extension';
  } else {
    clearDestination(data.destinationOfficeHours);
  }
  clearDestination(data.destinationOfficeClosed);
  clearDestination(data.destinationHoliday);
  if (opts.sipTrunkName) {
    (data as unknown as { phoneSystemName: string }).phoneSystemName = opts.sipTrunkName;
  }
  return vertex(id, 'did', number, x, y, false, data, dept);
}

function ivr(
  id: string, name: string, x: number, y: number, dept: string,
  extensionNumber: string,
  forwards: Array<{ key: string; extensionNumber: string }>,
): Vertex {
  const data = createDefaultNodeData('ivr', { label: name, extensionNumber }) as Ivr;
  data.departmentName = dept;
  clearDestination(data.destinationOfficeClosed);
  clearDestination(data.destinationBreak);
  clearDestination(data.destinationHoliday);
  data.forwards = forwards.map<IvrForward>(f => ({
    id: null, ivrId: null,
    type: 'Extension',
    input: f.key,
    peerType: null,
    destination: `Extension:${f.extensionNumber}`,
    tcxId: null,
    customData: null,
  }));
  return vertex(id, 'ivr', name, x, y, true, data, dept);
}

function ringGroup(
  id: string, name: string, x: number, y: number, dept: string,
  extensionNumber: string,
  members: RingGroupMember[],
  opts: { noAnswerExt?: string },
): Vertex {
  const data = createDefaultNodeData('ring-group', { label: name, extensionNumber }) as RingGroup;
  data.departmentName = dept;
  data.members = members;
  if (opts.noAnswerExt) {
    data.destinationNoAnswer.toValue = 'Extension';
    data.destinationNoAnswer.extensionNumber = opts.noAnswerExt;
    data.destinationNoAnswer.targetType = 'Extension';
  } else {
    clearDestination(data.destinationNoAnswer);
  }
  clearDestination(data.destinationOfficeClosed);
  clearDestination(data.destinationBreak);
  clearDestination(data.destinationHoliday);
  return vertex(id, 'ring-group', name, x, y, true, data, dept);
}

function callQueue(
  id: string, name: string, x: number, y: number, dept: string,
  extensionNumber: string,
  agents: CallQueueAgent[],
  opts: { noAnswerExt?: string },
): Vertex {
  const data = createDefaultNodeData('call-queue', { label: name, extensionNumber }) as CallQueue;
  data.departmentName = dept;
  data.agents = agents;
  if (opts.noAnswerExt) {
    data.destinationNoAnswer.toValue = 'Extension';
    data.destinationNoAnswer.extensionNumber = opts.noAnswerExt;
    data.destinationNoAnswer.targetType = 'Extension';
  } else {
    clearDestination(data.destinationNoAnswer);
  }
  clearDestination(data.destinationOfficeClosed);
  clearDestination(data.destinationBreak);
  clearDestination(data.destinationHoliday);
  return vertex(id, 'call-queue', name, x, y, true, data, dept);
}

function extension(
  id: string, extensionNumber: string, firstName: string, lastName: string,
  dept: string, x: number, y: number,
): Vertex {
  const data = createDefaultNodeData('extension', { extensionNumber, firstName, lastName }) as Extension;
  data.mainDepartmentName = dept;
  // Mirror onto the generic field used by graph filters.
  (data as unknown as { departmentName: string }).departmentName = dept;
  const label = `${extensionNumber} - ${firstName} ${lastName}`;
  return vertex(id, 'extension', label, x, y, true, data, dept);
}

function vertex(
  id: string, type: Vertex['type'], label: string, x: number, y: number,
  hasExtensionNumber: boolean, data: Vertex['data'], dept: string,
): Vertex {
  return {
    id, type, label, x, y,
    width: 160,
    height: hasExtensionNumber ? 75 : 59,
    data,
    meta: { department: dept },
  };
}

function m(extensionNumber: string, name: string): RingGroupMember {
  return { id: null, ringGroupId: null, name, extensionNumber };
}

function a(extensionNumber: string, name: string): CallQueueAgent {
  return { id: null, callQueueId: null, tcxId: null, name, extensionNumber, skillGroup: '' };
}

// Wipe a destination slot so it counts as "empty" for EdgeDerivationService —
// no edge is drawn and no end-call terminal is auto-spawned.
function clearDestination(d: {
  toValue: string | null;
  extensionNumber: string | null;
  external: string | null;
  name: string | null;
  targetType: string | null;
}): void {
  d.toValue = null;
  d.extensionNumber = null;
  d.external = null;
  d.name = null;
  d.targetType = null;
}
