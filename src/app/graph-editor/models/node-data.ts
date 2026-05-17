import { RingGroup } from './ringGroup';
import { CallQueue } from './callQueue';
import { Ivr } from './ivr';
import { DidNumber } from './didNumber';
import { Extension } from './extension';
import { SipTrunk } from './sipTrunk';
import { Voicemail } from './voicemail';
import { CallProcessingScript } from './callProcessingScript';
import { ExternalNumber } from './externalNumber';
import { Terminal } from './terminal';

export type NodeDataMap = {
  'ring-group':      RingGroup;
  'call-queue':      CallQueue;
  'ivr':             Ivr;
  'did':             DidNumber;
  'extension':       Extension;
  'sip-trunk':       SipTrunk;
  'voicemail':       Voicemail;
  'call-processing-script': CallProcessingScript;
  'external-number': ExternalNumber;
  'accept-anyway':   Terminal;
  'end-call':        Terminal;
};

export type NodeData = NodeDataMap[keyof NodeDataMap];
