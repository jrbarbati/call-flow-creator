import { Injectable, inject } from '@angular/core';
import { Vertex } from '../models/graph.models';
import { AddNodeCommand } from '../commands/add-node.command';
import { EdgeDerivationService, EnumeratedDestination, NodeIndex } from './edge-derivation.service';
import { NODE_TYPE_CONFIGS, NodeType } from '../models/node-types';
import { createDefaultNodeData } from '../models/node-data.factory';
import { deriveLabel } from '../models/node-data.labels';
import { AnyDestination, ParsedLegacy } from '../models/destination';
import { NodeDataSeed } from '../models/node-data.factory';

interface SpawnIntent {
  sourceId: string;
  type: NodeType;
  matchKey: string;          // identifier within type used for index lookup
  seed: NodeDataSeed;
}

@Injectable({ providedIn: 'root' })
export class AutoSpawnService {
  private readonly edgeDerivation = inject(EdgeDerivationService);

  // Compute the AddNodeCommands needed so every destination in `nodes` resolves to a target.
  // Iterates up to 50 times to handle cascades.
  requiredSpawns(nodes: Vertex[]): AddNodeCommand[] {
    let working = nodes;
    const out: AddNodeCommand[] = [];
    for (let i = 0; i < 50; i++) {
      const next = this.spawnsForOnce(working);
      if (next.length === 0) break;
      working = [...working, ...next.map(c => (c as unknown as { node: Vertex }).node)];
      out.push(...next);
    }
    return out;
  }

  private spawnsForOnce(nodes: Vertex[]): AddNodeCommand[] {
    const idx = this.edgeDerivation.indexNodes(nodes);
    const enumerated = this.edgeDerivation.enumerateDestinations(nodes);
    const sourceById = new Map(nodes.map(n => [n.id, n]));

    const wanted = new Map<string, SpawnIntent>(); // dedup key -> intent
    for (const item of enumerated) {
      const source = sourceById.get(item.sourceId);
      if (!source) continue;
      const intent = this.intentFor(item, source);
      if (!intent) continue;
      if (this.alreadyExists(intent, idx)) continue;
      const dedupKey = `${intent.type}|${intent.matchKey}|${intent.sourceId}`;
      if (!wanted.has(dedupKey)) wanted.set(dedupKey, intent);
    }

    const cmds: AddNodeCommand[] = [];
    let offset = 0;
    for (const intent of wanted.values()) {
      const source = sourceById.get(intent.sourceId)!;
      const node = this.materializeVertex(intent, source, offset);
      offset += 80;
      cmds.push(new AddNodeCommand(node));
    }
    return cmds;
  }

  private intentFor(item: EnumeratedDestination, source: Vertex): SpawnIntent | null {
    if (item.dest) return intentFromDestination(item.sourceId, item.dest);
    if (item.legacy) return intentFromParsed(item.sourceId, item.legacy.parsed, item.legacy.field);
    return null;
  }

  private alreadyExists(intent: SpawnIntent, idx: NodeIndex): boolean {
    switch (intent.type) {
      case 'voicemail':       return idx.voicemailByExt.has(intent.matchKey);
      case 'call-processing-script': return idx.callProcessingScriptByName.has(intent.matchKey);
      case 'external-number': return idx.externalByNumber.has(intent.matchKey);
      case 'accept-anyway':
      case 'end-call':        return idx.terminalByLink.has(`${intent.matchKey}|${intent.type}`);
      default: return true;
    }
  }

  private materializeVertex(intent: SpawnIntent, source: Vertex, indexOffset: number): Vertex {
    const config = NODE_TYPE_CONFIGS[intent.type];
    const seed = intent.seed;
    const data = createDefaultNodeData(intent.type, seed);
    const inheritedDept = (source.data as { departmentName?: string; departmentId?: number | null } | undefined)?.departmentName;
    if (inheritedDept) inheritDepartment(data, inheritedDept);
    const label = deriveLabel(intent.type, data) ?? config.label;
    const height = config.isTerminal ? 36 : (config.hasExtensionNumber ? 75 : 59);
    return {
      id: crypto.randomUUID(),
      type: intent.type,
      label,
      x: source.x + 280,
      y: source.y + indexOffset,
      width: config.isTerminal ? 120 : 160,
      height,
      data,
    };
  }
}

function intentFromDestination(sourceId: string, d: AnyDestination): SpawnIntent | null {
  if (d.toValue == null) return null;
  switch (d.toValue) {
    case 'VoiceMail':
      return d.extensionNumber
        ? { sourceId, type: 'voicemail', matchKey: d.extensionNumber, seed: seedFor.voicemail(d.extensionNumber, d.name ?? null) }
        : null;
    case 'VoiceApp':
      return d.name
        ? { sourceId, type: 'call-processing-script', matchKey: d.name, seed: seedFor.callProcessingScript(d.name) }
        : null;
    case 'External':
      return d.external
        ? { sourceId, type: 'external-number', matchKey: d.external, seed: seedFor.external(d.external, d.name ?? null) }
        : null;
    case 'ProceedWithNoExceptions':
      return { sourceId, type: 'accept-anyway', matchKey: `${sourceId}|${d.trigger}`, seed: seedFor.terminal(`${sourceId}|${d.trigger}`) };
    case 'None':
      return { sourceId, type: 'end-call', matchKey: `${sourceId}|${d.trigger}`, seed: seedFor.terminal(`${sourceId}|${d.trigger}`) };
    default: return null;
  }
}

function intentFromParsed(sourceId: string, p: ParsedLegacy, _field: 'timeout' | 'invalidkey'): SpawnIntent | null {
  switch (p.toValue) {
    case 'VoiceMail':
      return p.extensionNumber
        ? { sourceId, type: 'voicemail', matchKey: p.extensionNumber, seed: seedFor.voicemail(p.extensionNumber, p.name ?? null) }
        : null;
    case 'VoiceApp':
      return p.name
        ? { sourceId, type: 'call-processing-script', matchKey: p.name, seed: seedFor.callProcessingScript(p.name) }
        : null;
    case 'External':
      return p.external
        ? { sourceId, type: 'external-number', matchKey: p.external, seed: seedFor.external(p.external, null) }
        : null;
    default: return null;
  }
}

function inheritDepartment(data: unknown, departmentName: string): void {
  const obj = data as { departmentName?: string };
  if (obj && 'departmentName' in obj) obj.departmentName = departmentName;
}

const seedFor = {
  voicemail(extensionNumber: string, name: string | null) {
    return { extensionNumber, voicemailName: name ?? `VM ${extensionNumber}` };
  },
  callProcessingScript(name: string) {
    return { callProcessingScriptName: name, label: name };
  },
  external(num: string, label: string | null) {
    return { externalNumber: num, externalLabel: label ?? undefined, label: label ?? num };
  },
  terminal(sourceLinkKey: string) {
    return { sourceLinkKey };
  },
};
