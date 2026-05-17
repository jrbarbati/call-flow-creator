import { Command } from '../models/command.model';
import { Graph, Vertex } from '../models/graph.models';
import { DestinationTrigger, RingGroup } from '../models/ringGroup';
import { CallQueue } from '../models/callQueue';
import { Ivr, IvrForward } from '../models/ivr';
import { DidNumber } from '../models/didNumber';
import { SipTrunk } from '../models/sipTrunk';
import { Extension } from '../models/extension';
import { Voicemail } from '../models/voicemail';
import { CallProcessingScript } from '../models/callProcessingScript';
import { ExternalNumber } from '../models/externalNumber';
import { Terminal } from '../models/terminal';
import { AnyDestination, buildEmptyDestinationFields, applyDestinationFields } from '../models/destination';

interface DestPath { nodeId: string; trigger: DestinationTrigger; prev: AnyDestination; }
interface FwdPath  { nodeId: string; index: number; prev: IvrForward; }
interface StringPath { nodeId: string; field: 'timeoutDestination' | 'invalidKeyDestination'; prev: string | null; }

export class DeleteNodeCommand implements Command {
  readonly description = 'Delete node';

  // Captured at execute time for undo.
  private clearedDests: DestPath[] = [];
  private clearedForwards: FwdPath[] = [];
  private clearedStrings: StringPath[] = [];
  private reapedNodes: Vertex[] = [];

  constructor(private readonly node: Vertex) {}

  execute(state: Graph): Graph {
    this.clearedDests = [];
    this.clearedForwards = [];
    this.clearedStrings = [];
    this.reapedNodes = [];

    const targetIdentifiers = this.identifiersFor(this.node);

    // Walk every other node, clear destinations / forwards / legacy strings that point at this node.
    const updatedNodes: Vertex[] = state.nodes
      .filter(n => n.id !== this.node.id)
      .map(n => this.scrubReferences(n, targetIdentifiers));

    // Reap any terminal node whose sourceLinkKey is owned by the deleted node.
    const survivors: Vertex[] = [];
    for (const n of updatedNodes) {
      if ((n.type === 'accept-anyway' || n.type === 'end-call') && n.data) {
        const t = n.data as Terminal;
        if (t.sourceLinkKey.startsWith(`${this.node.id}|`)) {
          this.reapedNodes.push(n);
          continue;
        }
      }
      survivors.push(n);
    }

    return { nodes: survivors };
  }

  undo(state: Graph): Graph {
    // Reinsert deleted node + reaped terminals, then restore cleared references.
    let nodes = [...state.nodes, this.node, ...this.reapedNodes];

    nodes = nodes.map(n => {
      let working = n;
      for (const cd of this.clearedDests) {
        if (cd.nodeId === working.id) working = restoreDestinationOn(working, cd);
      }
      for (const cf of this.clearedForwards) {
        if (cf.nodeId === working.id) working = restoreForwardOn(working, cf);
      }
      for (const cs of this.clearedStrings) {
        if (cs.nodeId === working.id) working = restoreStringOn(working, cs);
      }
      return working;
    });

    return { nodes };
  }

  // -----------------------------------------------------------------------

  private identifiersFor(n: Vertex): TargetIdentifiers {
    const out: TargetIdentifiers = { extensionNumbers: new Set(), callProcessingScriptNames: new Set(), externalNumbers: new Set(), terminalSourceLinkPrefix: null };
    const data = n.data;
    if (!data) return out;
    switch (n.type) {
      case 'extension':       out.extensionNumbers.add((data as Extension).num); break;
      case 'ring-group':      out.extensionNumbers.add((data as RingGroup).extensionNumber); break;
      case 'call-queue':      out.extensionNumbers.add((data as CallQueue).extensionNumber); break;
      case 'ivr':             out.extensionNumbers.add((data as Ivr).extensionNumber); break;
      case 'voicemail':       out.extensionNumbers.add((data as Voicemail).extensionNumber); break;
      case 'call-processing-script': out.callProcessingScriptNames.add((data as CallProcessingScript).name); break;
      case 'external-number': out.externalNumbers.add((data as ExternalNumber).number); break;
      case 'accept-anyway':
      case 'end-call':
        out.terminalSourceLinkPrefix = (data as Terminal).sourceLinkKey;
        break;
    }
    return out;
  }

  private scrubReferences(n: Vertex, ids: TargetIdentifiers): Vertex {
    if (!n.data) return n;
    const triggers = triggersFor(n.type);
    let nextData: unknown = n.data;
    for (const trigger of triggers) {
      const prev = readDestOn(n, trigger);
      if (!prev) continue;
      if (!destReferences(prev, ids, this.node.type)) continue;
      this.clearedDests.push({ nodeId: n.id, trigger, prev });
      nextData = writeDestOn({ ...n, data: nextData as Vertex['data'] }, trigger,
        applyDestinationFields(prev, buildEmptyDestinationFields(trigger))) as Vertex['data'];
    }

    if (n.type === 'ivr') {
      const ivr = nextData as Ivr;
      const remaining: IvrForward[] = [];
      ivr.forwards?.forEach((f, i) => {
        if (forwardReferences(f, ids)) {
          this.clearedForwards.push({ nodeId: n.id, index: i, prev: f });
        } else {
          remaining.push(f);
        }
      });
      let mutated: Ivr = { ...ivr, forwards: remaining };
      if (legacyReferences(ivr.timeoutDestination, ids)) {
        this.clearedStrings.push({ nodeId: n.id, field: 'timeoutDestination', prev: ivr.timeoutDestination });
        mutated = { ...mutated, timeoutDestination: null };
      }
      if (legacyReferences(ivr.invalidKeyDestination, ids)) {
        this.clearedStrings.push({ nodeId: n.id, field: 'invalidKeyDestination', prev: ivr.invalidKeyDestination });
        mutated = { ...mutated, invalidKeyDestination: null };
      }
      nextData = mutated;
    }

    return { ...n, data: nextData as Vertex['data'] };
  }
}

interface TargetIdentifiers {
  extensionNumbers: Set<string>;
  callProcessingScriptNames: Set<string>;
  externalNumbers: Set<string>;
  terminalSourceLinkPrefix: string | null;
}

function destReferences(d: AnyDestination, ids: TargetIdentifiers, deletedType: Vertex['type']): boolean {
  if (!d || !d.toValue) return false;
  switch (d.toValue) {
    case 'Extension':
      return d.extensionNumber != null && ids.extensionNumbers.has(d.extensionNumber);
    case 'VoiceMail':
      return deletedType === 'voicemail' && d.extensionNumber != null && ids.extensionNumbers.has(d.extensionNumber);
    case 'VoiceApp':
      return deletedType === 'call-processing-script' && d.name != null && ids.callProcessingScriptNames.has(d.name);
    case 'External':
      return deletedType === 'external-number' && d.external != null && ids.externalNumbers.has(d.external);
    default:
      return false;
  }
}

function forwardReferences(f: IvrForward, ids: TargetIdentifiers): boolean {
  if (!f.destination) return false;
  if (ids.extensionNumbers.has(f.destination)) return true;
  if (ids.externalNumbers.has(f.destination)) return true;
  if (ids.callProcessingScriptNames.has(f.destination)) return true;
  return false;
}

function legacyReferences(s: string | null, ids: TargetIdentifiers): boolean {
  if (!s) return false;
  return ids.extensionNumbers.has(s) || ids.externalNumbers.has(s) || ids.callProcessingScriptNames.has(s);
}

function triggersFor(type: Vertex['type']): DestinationTrigger[] {
  switch (type) {
    case 'ring-group':
    case 'call-queue': return [DestinationTrigger.NO_ANSWER, DestinationTrigger.OFFICE_CLOSED, DestinationTrigger.BREAK, DestinationTrigger.HOLIDAY];
    case 'ivr':        return [DestinationTrigger.OFFICE_CLOSED, DestinationTrigger.BREAK, DestinationTrigger.HOLIDAY];
    case 'did':        return [DestinationTrigger.DEFAULT_ROUTE, DestinationTrigger.OFFICE_CLOSED, DestinationTrigger.HOLIDAY];
    case 'sip-trunk':  return [DestinationTrigger.DEFAULT_ROUTE];
    default:           return [];
  }
}

function readDestOn(n: Vertex, trigger: DestinationTrigger): AnyDestination | null {
  if (!n.data) return null;
  switch (n.type) {
    case 'ring-group':
    case 'call-queue': {
      const d = n.data as RingGroup | CallQueue;
      switch (trigger) {
        case DestinationTrigger.NO_ANSWER:     return d.destinationNoAnswer ?? null;
        case DestinationTrigger.OFFICE_CLOSED: return d.destinationOfficeClosed ?? null;
        case DestinationTrigger.BREAK:         return d.destinationBreak ?? null;
        case DestinationTrigger.HOLIDAY:       return d.destinationHoliday ?? null;
        default: return null;
      }
    }
    case 'ivr': {
      const d = n.data as Ivr;
      switch (trigger) {
        case DestinationTrigger.OFFICE_CLOSED: return d.destinationOfficeClosed ?? null;
        case DestinationTrigger.BREAK:         return d.destinationBreak ?? null;
        case DestinationTrigger.HOLIDAY:       return d.destinationHoliday ?? null;
        default: return null;
      }
    }
    case 'did': {
      const d = n.data as DidNumber;
      switch (trigger) {
        case DestinationTrigger.DEFAULT_ROUTE: return d.destinationOfficeHours ?? null;
        case DestinationTrigger.OFFICE_CLOSED: return d.destinationOfficeClosed ?? null;
        case DestinationTrigger.HOLIDAY:       return d.destinationHoliday ?? null;
        default: return null;
      }
    }
    case 'sip-trunk': {
      const d = n.data as SipTrunk;
      if (trigger === DestinationTrigger.DEFAULT_ROUTE) return d.defaultRoute ?? null;
      return null;
    }
  }
  return null;
}

function writeDestOn(n: Vertex, trigger: DestinationTrigger, dest: AnyDestination): unknown {
  if (!n.data) return n.data;
  switch (n.type) {
    case 'ring-group':
    case 'call-queue': {
      const d = { ...(n.data as RingGroup | CallQueue) } as RingGroup | CallQueue;
      switch (trigger) {
        case DestinationTrigger.NO_ANSWER:     d.destinationNoAnswer = dest as typeof d.destinationNoAnswer; break;
        case DestinationTrigger.OFFICE_CLOSED: d.destinationOfficeClosed = dest as typeof d.destinationOfficeClosed; break;
        case DestinationTrigger.BREAK:         d.destinationBreak = dest as typeof d.destinationBreak; break;
        case DestinationTrigger.HOLIDAY:       d.destinationHoliday = dest as typeof d.destinationHoliday; break;
      }
      d.destinations = mirror(d.destinations as AnyDestination[] | undefined, dest) as typeof d.destinations;
      return d;
    }
    case 'ivr': {
      const d = { ...(n.data as Ivr) } as Ivr;
      switch (trigger) {
        case DestinationTrigger.OFFICE_CLOSED: d.destinationOfficeClosed = dest as typeof d.destinationOfficeClosed; break;
        case DestinationTrigger.BREAK:         d.destinationBreak = dest as typeof d.destinationBreak; break;
        case DestinationTrigger.HOLIDAY:       d.destinationHoliday = dest as typeof d.destinationHoliday; break;
      }
      d.destinations = mirror(d.destinations as AnyDestination[] | undefined, dest) as typeof d.destinations;
      return d;
    }
    case 'did': {
      const d = { ...(n.data as DidNumber) } as DidNumber;
      switch (trigger) {
        case DestinationTrigger.DEFAULT_ROUTE: d.destinationOfficeHours = dest as typeof d.destinationOfficeHours; break;
        case DestinationTrigger.OFFICE_CLOSED: d.destinationOfficeClosed = dest as typeof d.destinationOfficeClosed; break;
        case DestinationTrigger.HOLIDAY:       d.destinationHoliday = dest as typeof d.destinationHoliday; break;
      }
      return d;
    }
    case 'sip-trunk': {
      const d = { ...(n.data as SipTrunk) } as SipTrunk;
      if (trigger === DestinationTrigger.DEFAULT_ROUTE) d.defaultRoute = dest as typeof d.defaultRoute;
      d.destinations = mirror(d.destinations as AnyDestination[] | undefined, dest) as typeof d.destinations;
      return d;
    }
  }
  return n.data;
}

function mirror(list: AnyDestination[] | undefined, dest: AnyDestination): AnyDestination[] {
  const without = (list ?? []).filter(d => d.trigger !== dest.trigger);
  return [...without, dest];
}

function restoreDestinationOn(n: Vertex, cd: DestPath): Vertex {
  return { ...n, data: writeDestOn(n, cd.trigger, cd.prev) as Vertex['data'] };
}

function restoreForwardOn(n: Vertex, cf: FwdPath): Vertex {
  if (n.type !== 'ivr' || !n.data) return n;
  const ivr = n.data as Ivr;
  const forwards = [...ivr.forwards];
  forwards.splice(cf.index, 0, cf.prev);
  return { ...n, data: { ...ivr, forwards } };
}

function restoreStringOn(n: Vertex, cs: StringPath): Vertex {
  if (n.type !== 'ivr' || !n.data) return n;
  const ivr = n.data as Ivr;
  return { ...n, data: { ...ivr, [cs.field]: cs.prev } as Ivr };
}
