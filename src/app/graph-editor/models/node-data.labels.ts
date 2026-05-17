import { NodeType } from './node-types';
import { NodeData } from './node-data';
import { RingGroup } from './ringGroup';
import { CallQueue } from './callQueue';
import { Ivr } from './ivr';
import { DidNumber } from './didNumber';
import { Extension } from './extension';
import { SipTrunk } from './sipTrunk';
import { Voicemail } from './voicemail';
import { CallProcessingScript } from './callProcessingScript';
import { ExternalNumber } from './externalNumber';

export function deriveLabel(type: NodeType, data: NodeData): string | null {
  switch (type) {
    case 'ring-group': {
      const r = data as RingGroup;
      if (!r.extensionNumber && !r.name) return null;
      return `${r.extensionNumber} - ${r.name}`;
    }
    case 'call-queue': {
      const q = data as CallQueue;
      if (!q.extensionNumber && !q.name) return null;
      return `${q.extensionNumber} - ${q.name}`;
    }
    case 'ivr': {
      const i = data as Ivr;
      if (!i.extensionNumber && !i.name) return null;
      return `${i.extensionNumber} - ${i.name}`;
    }
    case 'extension': {
      const e = data as Extension;
      if (!e.num && !e.firstName && !e.lastName) return null;
      return `${e.num} - ${e.firstName} ${e.lastName}`.trim();
    }
    case 'did': {
      const d = data as DidNumber;
      return d.number || null;
    }
    case 'sip-trunk': {
      const t = data as SipTrunk;
      return t.name || null;
    }
    case 'voicemail': {
      const v = data as Voicemail;
      return v.extensionNumber ? `VM ${v.extensionNumber}` : 'Voicemail';
    }
    case 'call-processing-script': {
      const a = data as CallProcessingScript;
      return a.name || 'Call Processing Script';
    }
    case 'external-number': {
      const x = data as ExternalNumber;
      return x.label || x.number || 'External';
    }
    case 'accept-anyway': return 'Accept Anyway';
    case 'end-call':      return 'End Call';
  }
}
