import { Command } from '../models/command.model';
import { Graph, Vertex } from '../models/graph.models';
import { DestinationTrigger, RingGroup } from '../models/ringGroup';
import { CallQueue } from '../models/callQueue';
import { Ivr, IvrForward } from '../models/ivr';
import { DidNumber } from '../models/didNumber';
import { SipTrunk } from '../models/sipTrunk';
import { AnyDestination, BuiltDestinationFields, applyDestinationFields, buildEmptyDestinationFields, DestSlot } from '../models/destination';

interface Snapshot {
  // Stores prior values per slot kind for undo. Only one branch is populated.
  prevDestination?: AnyDestination;
  prevForward?: IvrForward;
  prevForwardIndex?: number;
  prevTimeout?: string | null;
  prevInvalidKey?: string | null;
}

export type SetDestinationValue =
  | { kind: 'fields'; fields: BuiltDestinationFields }
  | { kind: 'forward-destination'; destination: string; forwardType?: string | null }
  | { kind: 'timeout-string'; value: string | null }
  | { kind: 'invalidkey-string'; value: string | null }
  | { kind: 'clear' };

export class SetDestinationCommand implements Command {
  readonly description = 'Set destination';
  private snapshot: Snapshot = {};

  constructor(
    private readonly sourceId: string,
    private readonly slot: DestSlot,
    private readonly next: SetDestinationValue,
  ) {}

  execute(state: Graph): Graph {
    return {
      ...state,
      nodes: state.nodes.map(n => n.id !== this.sourceId ? n : this.applyTo(n)),
    };
  }

  undo(state: Graph): Graph {
    return {
      ...state,
      nodes: state.nodes.map(n => n.id !== this.sourceId ? n : this.restoreTo(n)),
    };
  }

  // -----------------------------------------------------------------------

  private applyTo(node: Vertex): Vertex {
    const data = node.data;
    if (!data) return node;

    switch (this.slot.kind) {
      case 'destination': return { ...node, data: this.applyDestination(node, this.slot.trigger) as Vertex['data'] };
      case 'forward':     return { ...node, data: this.applyForward(node, this.slot.digit) as Vertex['data'] };
      case 'timeout':     return { ...node, data: this.applyTimeout(node) as Vertex['data'] };
      case 'invalidkey':  return { ...node, data: this.applyInvalidKey(node) as Vertex['data'] };
    }
  }

  private restoreTo(node: Vertex): Vertex {
    if (!node.data) return node;
    switch (this.slot.kind) {
      case 'destination': return { ...node, data: this.restoreDestination(node, this.slot.trigger) as Vertex['data'] };
      case 'forward':     return { ...node, data: this.restoreForward(node) as Vertex['data'] };
      case 'timeout':     return { ...node, data: this.restoreTimeout(node) as Vertex['data'] };
      case 'invalidkey':  return { ...node, data: this.restoreInvalidKey(node) as Vertex['data'] };
    }
  }

  // -----------------------------------------------------------------------

  private applyDestination(node: Vertex, trigger: DestinationTrigger): unknown {
    const data = node.data as RingGroup | CallQueue | Ivr | DidNumber | SipTrunk;
    const fields: BuiltDestinationFields = this.next.kind === 'fields'
      ? this.next.fields
      : this.next.kind === 'clear'
        ? buildEmptyDestinationFields(trigger)
        : buildEmptyDestinationFields(trigger);

    const prev = readDestination(node, trigger);
    if (prev) this.snapshot.prevDestination = prev;

    return writeDestination(node, trigger, applyDestinationFields(prev ?? minimalDest(trigger, node.type), fields));
  }

  private restoreDestination(node: Vertex, trigger: DestinationTrigger): unknown {
    if (!this.snapshot.prevDestination) {
      // Original had no destination — clear it.
      return writeDestination(node, trigger, applyDestinationFields(minimalDest(trigger, node.type), buildEmptyDestinationFields(trigger)));
    }
    return writeDestination(node, trigger, this.snapshot.prevDestination);
  }

  private applyForward(node: Vertex, digit: string): unknown {
    if (node.type !== 'ivr') return node.data;
    const ivr = node.data as Ivr;
    const idx = ivr.forwards.findIndex(f => f.input === digit);
    if (idx >= 0) {
      this.snapshot.prevForward = ivr.forwards[idx];
      this.snapshot.prevForwardIndex = idx;
    }

    if (this.next.kind === 'clear') {
      const forwards = ivr.forwards.filter(f => f.input !== digit);
      return { ...ivr, forwards } as Ivr;
    }
    if (this.next.kind === 'forward-destination') {
      const updated: IvrForward = {
        id: idx >= 0 ? ivr.forwards[idx].id : null,
        ivrId: idx >= 0 ? ivr.forwards[idx].ivrId : null,
        type: this.next.forwardType ?? 'extension',
        input: digit,
        peerType: idx >= 0 ? ivr.forwards[idx].peerType : null,
        destination: this.next.destination,
        tcxId: idx >= 0 ? ivr.forwards[idx].tcxId : null,
        customData: idx >= 0 ? ivr.forwards[idx].customData : null,
      } as IvrForward;
      const forwards = idx >= 0
        ? ivr.forwards.map((f, i) => i === idx ? updated : f)
        : [...ivr.forwards, updated];
      return { ...ivr, forwards } as Ivr;
    }
    return ivr;
  }

  private restoreForward(node: Vertex): unknown {
    if (node.type !== 'ivr') return node.data;
    const ivr = node.data as Ivr;
    const digit = (this.slot as { kind: 'forward'; digit: string }).digit;
    if (!this.snapshot.prevForward) {
      const forwards = ivr.forwards.filter(f => f.input !== digit);
      return { ...ivr, forwards } as Ivr;
    }
    const idx = ivr.forwards.findIndex(f => f.input === digit);
    if (idx >= 0) {
      const forwards = ivr.forwards.map((f, i) => i === idx ? this.snapshot.prevForward! : f);
      return { ...ivr, forwards } as Ivr;
    }
    return { ...ivr, forwards: [...ivr.forwards, this.snapshot.prevForward] } as Ivr;
  }

  private applyTimeout(node: Vertex): unknown {
    if (node.type !== 'ivr') return node.data;
    const ivr = node.data as Ivr;
    this.snapshot.prevTimeout = ivr.timeoutDestination;
    const value = this.next.kind === 'timeout-string' ? this.next.value : null;
    return { ...ivr, timeoutDestination: value } as Ivr;
  }

  private restoreTimeout(node: Vertex): unknown {
    if (node.type !== 'ivr') return node.data;
    const ivr = node.data as Ivr;
    return { ...ivr, timeoutDestination: this.snapshot.prevTimeout ?? null } as Ivr;
  }

  private applyInvalidKey(node: Vertex): unknown {
    if (node.type !== 'ivr') return node.data;
    const ivr = node.data as Ivr;
    this.snapshot.prevInvalidKey = ivr.invalidKeyDestination;
    const value = this.next.kind === 'invalidkey-string' ? this.next.value : null;
    return { ...ivr, invalidKeyDestination: value } as Ivr;
  }

  private restoreInvalidKey(node: Vertex): unknown {
    if (node.type !== 'ivr') return node.data;
    const ivr = node.data as Ivr;
    return { ...ivr, invalidKeyDestination: this.snapshot.prevInvalidKey ?? null } as Ivr;
  }
}

// ---------------------------------------------------------------------------
// Helpers (exported for use by detail panel + tests)
// ---------------------------------------------------------------------------

export function readDestination(node: Vertex, trigger: DestinationTrigger): AnyDestination | null {
  if (!node.data) return null;
  switch (node.type) {
    case 'ring-group':
    case 'call-queue': {
      const d = node.data as RingGroup | CallQueue;
      switch (trigger) {
        case DestinationTrigger.NO_ANSWER:     return d.destinationNoAnswer ?? null;
        case DestinationTrigger.OFFICE_CLOSED: return d.destinationOfficeClosed ?? null;
        case DestinationTrigger.BREAK:         return d.destinationBreak ?? null;
        case DestinationTrigger.HOLIDAY:       return d.destinationHoliday ?? null;
        default: return null;
      }
    }
    case 'ivr': {
      const d = node.data as Ivr;
      switch (trigger) {
        case DestinationTrigger.OFFICE_CLOSED: return d.destinationOfficeClosed ?? null;
        case DestinationTrigger.BREAK:         return d.destinationBreak ?? null;
        case DestinationTrigger.HOLIDAY:       return d.destinationHoliday ?? null;
        default: return null;
      }
    }
    case 'did': {
      const d = node.data as DidNumber;
      switch (trigger) {
        case DestinationTrigger.DEFAULT_ROUTE: return d.destinationOfficeHours ?? null;
        case DestinationTrigger.OFFICE_CLOSED: return d.destinationOfficeClosed ?? null;
        case DestinationTrigger.HOLIDAY:       return d.destinationHoliday ?? null;
        default: return null;
      }
    }
    case 'sip-trunk': {
      const d = node.data as SipTrunk;
      if (trigger === DestinationTrigger.DEFAULT_ROUTE) return d.defaultRoute ?? null;
      return null;
    }
  }
  return null;
}

function writeDestination(node: Vertex, trigger: DestinationTrigger, dest: AnyDestination): unknown {
  switch (node.type) {
    case 'ring-group':
    case 'call-queue':
      return writeOnRgOrCq(node.data as RingGroup | CallQueue, trigger, dest);
    case 'ivr':
      return writeOnIvr(node.data as Ivr, trigger, dest);
    case 'did':
      return writeOnDid(node.data as DidNumber, trigger, dest);
    case 'sip-trunk':
      return writeOnSipTrunk(node.data as SipTrunk, trigger, dest);
  }
  return node.data;
}

function writeOnRgOrCq<T extends RingGroup | CallQueue>(d: T, trigger: DestinationTrigger, dest: AnyDestination): T {
  const next = { ...d } as T;
  switch (trigger) {
    case DestinationTrigger.NO_ANSWER:     next.destinationNoAnswer = dest as T['destinationNoAnswer']; break;
    case DestinationTrigger.OFFICE_CLOSED: next.destinationOfficeClosed = dest as T['destinationOfficeClosed']; break;
    case DestinationTrigger.BREAK:         next.destinationBreak = dest as T['destinationBreak']; break;
    case DestinationTrigger.HOLIDAY:       next.destinationHoliday = dest as T['destinationHoliday']; break;
  }
  next.destinations = mirrorDestinations(d.destinations as AnyDestination[], dest) as T['destinations'];
  return next;
}

function writeOnIvr(d: Ivr, trigger: DestinationTrigger, dest: AnyDestination): Ivr {
  const next = { ...d } as Ivr;
  switch (trigger) {
    case DestinationTrigger.OFFICE_CLOSED: next.destinationOfficeClosed = dest as Ivr['destinationOfficeClosed']; break;
    case DestinationTrigger.BREAK:         next.destinationBreak = dest as Ivr['destinationBreak']; break;
    case DestinationTrigger.HOLIDAY:       next.destinationHoliday = dest as Ivr['destinationHoliday']; break;
  }
  next.destinations = mirrorDestinations(d.destinations as AnyDestination[], dest) as Ivr['destinations'];
  return next;
}

function writeOnDid(d: DidNumber, trigger: DestinationTrigger, dest: AnyDestination): DidNumber {
  const next = { ...d } as DidNumber;
  switch (trigger) {
    case DestinationTrigger.DEFAULT_ROUTE: next.destinationOfficeHours = dest as DidNumber['destinationOfficeHours']; break;
    case DestinationTrigger.OFFICE_CLOSED: next.destinationOfficeClosed = dest as DidNumber['destinationOfficeClosed']; break;
    case DestinationTrigger.HOLIDAY:       next.destinationHoliday = dest as DidNumber['destinationHoliday']; break;
  }
  return next;
}

function writeOnSipTrunk(d: SipTrunk, trigger: DestinationTrigger, dest: AnyDestination): SipTrunk {
  const next = { ...d } as SipTrunk;
  if (trigger === DestinationTrigger.DEFAULT_ROUTE) {
    next.defaultRoute = dest as SipTrunk['defaultRoute'];
  }
  next.destinations = mirrorDestinations(d.destinations as AnyDestination[], dest) as SipTrunk['destinations'];
  return next;
}

function mirrorDestinations(list: AnyDestination[] | undefined, dest: AnyDestination): AnyDestination[] {
  const without = (list ?? []).filter(d => d.trigger !== dest.trigger);
  return [...without, dest];
}

function minimalDest(trigger: DestinationTrigger, nodeType: Vertex['type']): AnyDestination {
  const now = Date.now();
  const base = {
    id: null,
    trigger,
    name: null, targetType: null, extensionNumber: null,
    toValue: 'None', external: null, prompt: null, promptEnabled: false,
    createdTimestamp: now, updatedTimestamp: now, removedTimestamp: null,
  };
  switch (nodeType) {
    case 'ring-group': return { ...base, ringGroupId: null } as unknown as AnyDestination;
    case 'call-queue': return { ...base, callQueueId: null } as unknown as AnyDestination;
    case 'ivr':        return { ...base, ivrId: null } as unknown as AnyDestination;
    case 'did':        return { ...base, didNumberId: null } as unknown as AnyDestination;
    case 'sip-trunk':  return { ...base, sipTrunkId: null } as unknown as AnyDestination;
    default:           return { ...base } as unknown as AnyDestination;
  }
}
