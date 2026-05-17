import { DestinationTrigger, RingGroup, RingGroupDestination } from './ringGroup';
import { CallQueue, CallQueueDestination } from './callQueue';
import { Ivr, IvrDestination } from './ivr';
import { DidNumber, DidNumberDestination } from './didNumber';
import { SipTrunk, SipTrunkDestination } from './sipTrunk';
import { Extension } from './extension';
import { Voicemail } from './voicemail';
import { CallProcessingScript } from './callProcessingScript';
import { ExternalNumber } from './externalNumber';
import { Terminal } from './terminal';
import { Vertex } from './graph.models';
import { NodeType } from './node-types';

export type AnyDestination =
  | RingGroupDestination
  | CallQueueDestination
  | IvrDestination
  | DidNumberDestination
  | SipTrunkDestination;

export type DestinationToValue =
  | 'Extension'
  | 'VoiceMail'
  | 'VoiceApp'
  | 'External'
  | 'ProceedWithNoExceptions'
  | 'None';

export type TriggerColorKey =
  | DestinationTrigger
  | 'FORWARD'
  | 'TIMEOUT'
  | 'INVALID_KEY';

export const TRIGGER_COLORS: Record<TriggerColorKey, string> = {
  [DestinationTrigger.NO_ANSWER]:     '#9ca3af',
  [DestinationTrigger.OFFICE_CLOSED]: '#f59e0b',
  [DestinationTrigger.BREAK]:         '#eab308',
  [DestinationTrigger.HOLIDAY]:       '#ef4444',
  [DestinationTrigger.DEFAULT_ROUTE]: '#10b981',
  FORWARD:     '#3b82f6',
  TIMEOUT:     '#a855f7',
  INVALID_KEY: '#64748b',
};

export function triggerColorFor(kind: TriggerColorKey): string {
  return TRIGGER_COLORS[kind];
}

export function triggerLabelFor(sourceType: NodeType, trigger: DestinationTrigger): string {
  if (trigger === DestinationTrigger.DEFAULT_ROUTE) {
    return sourceType === 'sip-trunk' ? 'Default Route' : 'Office Hours';
  }
  switch (trigger) {
    case DestinationTrigger.NO_ANSWER:     return 'No Answer';
    case DestinationTrigger.OFFICE_CLOSED: return 'Office Closed';
    case DestinationTrigger.BREAK:         return 'Break';
    case DestinationTrigger.HOLIDAY:       return 'Holiday';
  }
}

// ---------------------------------------------------------------------------
// Edge identity
// ---------------------------------------------------------------------------

export type EdgeKind = 'dest' | 'fwd' | 'timeout' | 'invalidkey';

export interface EdgeId {
  sourceId: string;
  kind: EdgeKind;
  key: string; // trigger enum value or digit; '' for timeout/invalidkey
}

export function encodeEdgeId(id: EdgeId): string {
  if (id.kind === 'timeout' || id.kind === 'invalidkey') {
    return `${id.sourceId}|${id.kind}`;
  }
  return `${id.sourceId}|${id.kind}|${id.key}`;
}

export function parseEdgeId(s: string): EdgeId | null {
  const parts = s.split('|');
  if (parts.length === 2 && (parts[1] === 'timeout' || parts[1] === 'invalidkey')) {
    return { sourceId: parts[0], kind: parts[1] as EdgeKind, key: '' };
  }
  if (parts.length === 3 && (parts[1] === 'dest' || parts[1] === 'fwd')) {
    return { sourceId: parts[0], kind: parts[1] as EdgeKind, key: parts[2] };
  }
  return null;
}

export type DestSlot =
  | { kind: 'destination'; trigger: DestinationTrigger }
  | { kind: 'forward'; digit: string }
  | { kind: 'timeout' }
  | { kind: 'invalidkey' };

export function edgeIdToSlot(id: EdgeId): DestSlot {
  if (id.kind === 'timeout') return { kind: 'timeout' };
  if (id.kind === 'invalidkey') return { kind: 'invalidkey' };
  if (id.kind === 'fwd') return { kind: 'forward', digit: id.key };
  return { kind: 'destination', trigger: id.key as DestinationTrigger };
}

// ---------------------------------------------------------------------------
// Formatting + parsing
// ---------------------------------------------------------------------------

interface DestinationLike {
  toValue: string | null;
  external: string | null;
  extensionNumber: string | null;
  name: string | null;
}

export function formatDestination(d: DestinationLike | undefined | null): string {
  if (!d) return '-';
  if (d.toValue === 'ProceedWithNoExceptions') return 'Accept Anyway';
  if (d.toValue === 'None') return 'End Call';
  if (d.toValue === 'External') return `External (${d.external ?? ''})`;
  return `${d.name ?? ''} (${d.extensionNumber ?? ''} - ${d.toValue ?? 'None'})`.trim();
}

export interface ParsedLegacy {
  toValue: DestinationToValue | 'Unknown';
  extensionNumber: string | null;
  external: string | null;
  name: string | null;
}

export function parseLegacyDestinationString(s: string | null | undefined): ParsedLegacy {
  if (!s) return { toValue: 'None', extensionNumber: null, external: null, name: null };
  const trimmed = s.trim();
  if (!trimmed || /^(none|endcall|end\s*call)$/i.test(trimmed)) {
    return { toValue: 'None', extensionNumber: null, external: null, name: null };
  }
  const m = trimmed.match(/^(?<kind>VoiceMail|VoiceApp|External|Extension):(?<val>.+)$/);
  if (m?.groups) {
    const kind = m.groups['kind'] as DestinationToValue;
    const val = m.groups['val'];
    if (kind === 'External' || kind === 'VoiceApp') {
      return { toValue: kind, extensionNumber: null, external: kind === 'External' ? val : null, name: kind === 'VoiceApp' ? val : null };
    }
    return { toValue: kind, extensionNumber: val, external: null, name: null };
  }
  if (trimmed.startsWith('+') || /^[0-9]{8,}$/.test(trimmed)) {
    return { toValue: 'External', extensionNumber: null, external: trimmed, name: null };
  }
  if (/^\d{2,5}$/.test(trimmed)) {
    return { toValue: 'Extension', extensionNumber: trimmed, external: null, name: null };
  }
  return { toValue: 'Unknown', extensionNumber: null, external: null, name: trimmed };
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

export interface BuiltDestinationFields {
  trigger: DestinationTrigger;
  name: string | null;
  targetType: string | null;
  extensionNumber: string | null;
  toValue: string | null;
  external: string | null;
  prompt: string | null;
  promptEnabled: boolean;
}

export function buildDestinationFromTarget(target: Vertex, trigger: DestinationTrigger): BuiltDestinationFields {
  const base = { trigger, prompt: null, promptEnabled: false };
  switch (target.type) {
    case 'extension': {
      const e = target.data as Extension;
      return {
        ...base,
        name: `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || null,
        targetType: 'Extension',
        extensionNumber: e.num ?? null,
        toValue: 'Extension',
        external: null,
      };
    }
    case 'ring-group': {
      const r = target.data as RingGroup;
      return {
        ...base,
        name: r.name ?? null,
        targetType: 'RingGroup',
        extensionNumber: r.extensionNumber ?? null,
        toValue: 'Extension',
        external: null,
      };
    }
    case 'call-queue': {
      const q = target.data as CallQueue;
      return {
        ...base,
        name: q.name ?? null,
        targetType: 'CallQueue',
        extensionNumber: q.extensionNumber ?? null,
        toValue: 'Extension',
        external: null,
      };
    }
    case 'ivr': {
      const i = target.data as Ivr;
      return {
        ...base,
        name: i.name ?? null,
        targetType: 'IVR',
        extensionNumber: i.extensionNumber ?? null,
        toValue: 'Extension',
        external: null,
      };
    }
    case 'voicemail': {
      const v = target.data as Voicemail;
      return {
        ...base,
        name: v.name ?? null,
        targetType: 'VoiceMail',
        extensionNumber: v.extensionNumber ?? null,
        toValue: 'VoiceMail',
        external: null,
      };
    }
    case 'call-processing-script': {
      const a = target.data as CallProcessingScript;
      return {
        ...base,
        name: a.name ?? null,
        targetType: 'VoiceApp',
        extensionNumber: null,
        toValue: 'VoiceApp',
        external: null,
      };
    }
    case 'external-number': {
      const x = target.data as ExternalNumber;
      return {
        ...base,
        name: x.label ?? x.number ?? null,
        targetType: 'External',
        extensionNumber: null,
        toValue: 'External',
        external: x.number ?? null,
      };
    }
    case 'accept-anyway': {
      const _t = target.data as Terminal;
      return { ...base, name: 'Accept Anyway', targetType: null, extensionNumber: null, toValue: 'ProceedWithNoExceptions', external: null };
    }
    case 'end-call': {
      const _t = target.data as Terminal;
      return { ...base, name: 'End Call', targetType: null, extensionNumber: null, toValue: 'None', external: null };
    }
    default:
      return { ...base, name: null, targetType: null, extensionNumber: null, toValue: null, external: null };
  }
}

export function buildEmptyDestinationFields(trigger: DestinationTrigger): BuiltDestinationFields {
  return {
    trigger,
    name: null,
    targetType: null,
    extensionNumber: null,
    toValue: 'None',
    external: null,
    prompt: null,
    promptEnabled: false,
  };
}

// Apply built fields onto an existing typed destination, returning a new instance of the same shape.
// Preserves id/parentId/timestamps.
export function applyDestinationFields<D extends AnyDestination>(prev: D, fields: BuiltDestinationFields): D {
  return {
    ...prev,
    trigger: fields.trigger,
    name: fields.name,
    targetType: fields.targetType,
    extensionNumber: fields.extensionNumber,
    toValue: fields.toValue,
    external: fields.external,
    prompt: fields.prompt,
    promptEnabled: fields.promptEnabled,
    updatedTimestamp: Date.now(),
  };
}
