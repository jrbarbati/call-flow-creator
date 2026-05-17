import { Injectable } from '@angular/core';
import { Edge, Vertex } from '../models/graph.models';
import { DestinationTrigger, RingGroup } from '../models/ringGroup';
import { CallQueue } from '../models/callQueue';
import { Ivr, IvrForward } from '../models/ivr';
import { DidNumber, DidNumberDestination } from '../models/didNumber';
import { SipTrunk, SipTrunkDestination } from '../models/sipTrunk';
import { Voicemail } from '../models/voicemail';
import { CallProcessingScript } from '../models/callProcessingScript';
import { ExternalNumber } from '../models/externalNumber';
import { Terminal } from '../models/terminal';
import { Extension } from '../models/extension';
import { AnyDestination, ParsedLegacy, encodeEdgeId, parseLegacyDestinationString } from '../models/destination';

export interface NodeIndex {
  byExtensionNumber: Map<string, string>;
  voicemailByExt: Map<string, string>;
  callProcessingScriptByName: Map<string, string>;
  externalByNumber: Map<string, string>;
  terminalByLink: Map<string, string>;
  didByNumber: Map<string, string>;
  // For each DID number, the trunk that owns it (provides defaultRoute fallback).
  trunkByDidNumber: Map<string, { trunkNodeId: string; defaultRoute: SipTrunkDestination }>;
}

@Injectable({ providedIn: 'root' })
export class EdgeDerivationService {
  deriveEdges(nodes: Vertex[]): Edge[] {
    const idx = this.indexNodes(nodes);
    const out: Edge[] = [];
    for (const n of nodes) {
      for (const e of this.edgesForNode(n, idx)) out.push(e);
    }
    return out;
  }

  // Exposed for AutoSpawnService: list every logical destination that needs a target node.
  enumerateDestinations(nodes: Vertex[]): EnumeratedDestination[] {
    const out: EnumeratedDestination[] = [];
    for (const n of nodes) {
      out.push(...this.destinationsForNode(n));
    }
    return out;
  }

  indexNodes(nodes: Vertex[]): NodeIndex {
    const idx: NodeIndex = {
      byExtensionNumber: new Map(),
      voicemailByExt: new Map(),
      callProcessingScriptByName: new Map(),
      externalByNumber: new Map(),
      terminalByLink: new Map(),
      didByNumber: new Map(),
      trunkByDidNumber: new Map(),
    };
    for (const n of nodes) {
      const data = n.data;
      if (!data) continue;
      switch (n.type) {
        case 'extension': {
          const e = data as Extension;
          if (e.num) idx.byExtensionNumber.set(e.num, n.id);
          break;
        }
        case 'ring-group':
        case 'call-queue':
        case 'ivr': {
          const d = data as RingGroup | CallQueue | Ivr;
          if (d.extensionNumber) idx.byExtensionNumber.set(d.extensionNumber, n.id);
          break;
        }
        case 'voicemail': {
          const v = data as Voicemail;
          if (v.extensionNumber) idx.voicemailByExt.set(v.extensionNumber, n.id);
          break;
        }
        case 'call-processing-script': {
          const a = data as CallProcessingScript;
          if (a.name) idx.callProcessingScriptByName.set(a.name, n.id);
          break;
        }
        case 'external-number': {
          const x = data as ExternalNumber;
          if (x.number) idx.externalByNumber.set(x.number, n.id);
          break;
        }
        case 'accept-anyway':
        case 'end-call': {
          const t = data as Terminal;
          if (t.sourceLinkKey) idx.terminalByLink.set(`${t.sourceLinkKey}|${n.type}`, n.id);
          break;
        }
        case 'did': {
          const d = data as DidNumber;
          if (d.number) idx.didByNumber.set(d.number, n.id);
          break;
        }
        case 'sip-trunk': {
          const t = data as SipTrunk;
          for (const num of t.didNumbers ?? []) {
            if (num) idx.trunkByDidNumber.set(num, { trunkNodeId: n.id, defaultRoute: t.defaultRoute });
          }
          break;
        }
      }
    }
    return idx;
  }

  resolveDestinationTarget(d: AnyDestination, sourceId: string, idx: NodeIndex): string | null {
    switch (d.toValue) {
      case 'Extension':
        return d.extensionNumber ? idx.byExtensionNumber.get(d.extensionNumber) ?? null : null;
      case 'VoiceMail':
        return d.extensionNumber ? idx.voicemailByExt.get(d.extensionNumber) ?? null : null;
      case 'VoiceApp':
        return d.name ? idx.callProcessingScriptByName.get(d.name) ?? null : null;
      case 'External':
        return d.external ? idx.externalByNumber.get(d.external) ?? null : null;
      case 'ProceedWithNoExceptions':
        return idx.terminalByLink.get(`${sourceId}|${d.trigger}|accept-anyway`) ?? null;
      case 'None':
        return idx.terminalByLink.get(`${sourceId}|${d.trigger}|end-call`) ?? null;
      default:
        return null;
    }
  }

  // -----------------------------------------------------------------------

  private destinationsForNode(n: Vertex): EnumeratedDestination[] {
    const out: EnumeratedDestination[] = [];
    const data = n.data;
    if (!data) return out;
    switch (n.type) {
      case 'ring-group':
      case 'call-queue': {
        const d = data as RingGroup | CallQueue;
        for (const dest of [d.destinationNoAnswer, d.destinationOfficeClosed, d.destinationBreak, d.destinationHoliday]) {
          if (dest) out.push({ sourceId: n.id, dest });
        }
        break;
      }
      case 'ivr': {
        const i = data as Ivr;
        for (const dest of [i.destinationOfficeClosed, i.destinationBreak, i.destinationHoliday]) {
          if (dest) out.push({ sourceId: n.id, dest });
        }
        for (const f of i.forwards ?? []) {
          out.push({ sourceId: n.id, forward: f });
        }
        if (i.timeoutDestination) {
          out.push({ sourceId: n.id, legacy: { field: 'timeout', value: i.timeoutDestination, parsed: parseLegacyDestinationString(i.timeoutDestination) } });
        }
        if (i.invalidKeyDestination) {
          out.push({ sourceId: n.id, legacy: { field: 'invalidkey', value: i.invalidKeyDestination, parsed: parseLegacyDestinationString(i.invalidKeyDestination) } });
        }
        break;
      }
      case 'did': {
        const d = data as DidNumber;
        // OfficeHours falls back to the parent trunk's defaultRoute when empty;
        // that case is handled in edgesForNode, not here, since auto-spawn must
        // not synthesize end-call terminals for an empty office-hours slot.
        for (const dest of [d.destinationOfficeHours, d.destinationOfficeClosed, d.destinationHoliday]) {
          if (dest && !isEmptyDestination(dest)) out.push({ sourceId: n.id, dest });
        }
        break;
      }
      case 'sip-trunk': {
        // Trunk edges fan out to assigned DID nodes — see edgesForNode.
        // defaultRoute is consumed by each DID's office-hours fallback, not by
        // the trunk itself, so we deliberately do not enumerate it here.
        break;
      }
    }
    return out;
  }

  private edgesForNode(n: Vertex, idx: NodeIndex): Edge[] {
    if (n.type === 'sip-trunk') return this.sipTrunkEdges(n, idx);
    if (n.type === 'did')       return this.didEdges(n, idx);
    const out: Edge[] = [];
    for (const item of this.destinationsForNode(n)) {
      const e = this.toEdge(n, item, idx);
      if (e) out.push(e);
    }
    return out;
  }

  private sipTrunkEdges(n: Vertex, idx: NodeIndex): Edge[] {
    const t = n.data as SipTrunk;
    const out: Edge[] = [];
    for (const num of t.didNumbers ?? []) {
      const targetId = idx.didByNumber.get(num);
      if (!targetId) continue;
      const isMain = num === t.externalNumber;
      out.push({
        id: `${n.id}|didref|${num}`,
        sourceId: n.id,
        targetId,
        meta: { kind: 'didref', didNumber: num, isMainTrunkNumber: isMain },
      });
    }
    return out;
  }

  private didEdges(n: Vertex, idx: NodeIndex): Edge[] {
    const d = n.data as DidNumber;
    const out: Edge[] = [];

    // Office hours: own destination, else inherited from the parent trunk's defaultRoute.
    if (isEmptyDestination(d.destinationOfficeHours)) {
      const parent = idx.trunkByDidNumber.get(d.number);
      if (parent && !isEmptyDestination(parent.defaultRoute)) {
        const targetId = this.resolveDestinationTarget(parent.defaultRoute, n.id, idx);
        if (targetId) {
          out.push({
            id: encodeEdgeId({ sourceId: n.id, kind: 'dest', key: DestinationTrigger.DEFAULT_ROUTE }),
            sourceId: n.id,
            targetId,
            meta: { trigger: DestinationTrigger.DEFAULT_ROUTE, toValue: parent.defaultRoute.toValue, inheritedFromTrunk: true },
          });
        }
      }
    } else {
      const e = this.toEdge(n, { sourceId: n.id, dest: d.destinationOfficeHours }, idx);
      if (e) out.push(e);
    }

    for (const dest of [d.destinationOfficeClosed, d.destinationHoliday]) {
      if (!dest || isEmptyDestination(dest)) continue;
      const e = this.toEdge(n, { sourceId: n.id, dest }, idx);
      if (e) out.push(e);
    }

    return out;
  }

  private toEdge(source: Vertex, item: EnumeratedDestination, idx: NodeIndex): Edge | null {
    if (item.dest) {
      const dest = item.dest;
      if (dest.toValue == null) return null;
      const targetId = this.resolveDestinationTarget(dest, source.id, idx);
      if (!targetId) return null;
      return {
        id: encodeEdgeId({ sourceId: source.id, kind: 'dest', key: dest.trigger }),
        sourceId: source.id,
        targetId,
        meta: { trigger: dest.trigger, toValue: dest.toValue },
      };
    }
    if (item.forward) {
      const f = item.forward;
      const targetId = this.targetFromLegacy(f.destination, idx);
      if (!targetId) return null;
      return {
        id: encodeEdgeId({ sourceId: source.id, kind: 'fwd', key: f.input }),
        sourceId: source.id,
        targetId,
        label: f.input,
        meta: { kind: 'forward', digit: f.input },
      };
    }
    if (item.legacy) {
      const targetId = this.targetFromLegacy(item.legacy.value, idx);
      if (!targetId) return null;
      const kind = item.legacy.field === 'timeout' ? 'timeout' : 'invalidkey';
      return {
        id: encodeEdgeId({ sourceId: source.id, kind, key: '' }),
        sourceId: source.id,
        targetId,
        meta: { kind },
      };
    }
    return null;
  }

  private targetFromLegacy(s: string | null | undefined, idx: NodeIndex): string | null {
    const p = parseLegacyDestinationString(s);
    if (p.toValue === 'Extension' && p.extensionNumber) return idx.byExtensionNumber.get(p.extensionNumber) ?? null;
    if (p.toValue === 'External' && p.external) return idx.externalByNumber.get(p.external) ?? null;
    if (p.toValue === 'VoiceMail' && p.extensionNumber) return idx.voicemailByExt.get(p.extensionNumber) ?? null;
    if (p.toValue === 'VoiceApp' && p.name) return idx.callProcessingScriptByName.get(p.name) ?? null;
    return null;
  }
}

export interface EnumeratedDestination {
  sourceId: string;
  dest?: AnyDestination;
  forward?: IvrForward;
  legacy?: { field: 'timeout' | 'invalidkey'; value: string; parsed: ParsedLegacy };
}

// A destination slot counts as "empty" when it carries no routing intent —
// either null/undefined, or present but with no toValue and no target identifiers.
// Used so a DID with no office-hours destination inherits the parent trunk's defaultRoute.
function isEmptyDestination(d: AnyDestination | DidNumberDestination | SipTrunkDestination | null | undefined): boolean {
  if (!d) return true;
  const hasToValue = !!d.toValue && d.toValue !== '';
  const hasTarget =
    (!!d.extensionNumber && d.extensionNumber !== '') ||
    (!!d.external && d.external !== '') ||
    (!!d.name && d.name !== '');
  return !hasToValue && !hasTarget;
}
