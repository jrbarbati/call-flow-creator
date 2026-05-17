export type NodeType =
  | 'sip-trunk'
  | 'did'
  | 'ivr'
  | 'ring-group'
  | 'call-queue'
  | 'extension'
  | 'voicemail'
  | 'call-processing-script'
  | 'external-number'
  | 'accept-anyway'
  | 'end-call';

export type PaletteSection = 'call-flow' | 'destinations';

export const NODE_TYPES: NodeType[] = [
  'sip-trunk', 'did', 'ivr', 'ring-group', 'call-queue', 'extension',
  'voicemail', 'call-processing-script', 'external-number', 'accept-anyway', 'end-call',
];

export interface NodeTypeConfig {
  type: NodeType;
  label: string;
  color: string;
  iconPath: string;
  hasOutputPort: boolean;
  hasExtensionNumber: boolean;
  paletteSection: PaletteSection;
  isTerminal?: boolean;
}

// SVG path data for 14x14 viewBox icons
const ICON_SIP_TRUNK      = 'M3 1h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm1 3v2h2V4H4zm4 0v2h2V4H8zM4 8v2h2V8H4zm4 0v2h2V8H8z';
const ICON_DID            = 'M4 1v12M10 1v12M1 4h12M1 10h12';
const ICON_IVR            = 'M2 2h10v3H2zm0 4.5h4.5v5.5H2zm5.5 0H12v5.5H7.5z';
const ICON_RING_GROUP     = 'M7 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-4.5 7.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M2 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM12 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z';
const ICON_CALL_QUEUE     = 'M1 3h12M1 7h12M1 11h8M10 10l2 2 2-2';
const ICON_EXTENSION      = 'M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 7c0-2.8 2.2-5 5-5s5 2.2 5 5';
const ICON_VOICEMAIL      = 'M1 4h12v8H1z M3 6l4 3 4-3';
const ICON_CALL_PROCESSING_SCRIPT = 'M7 1v6 M3 4h8 M2 9h10v4H2z';
const ICON_EXTERNAL       = 'M2 7h10 M9 4l3 3-3 3';
const ICON_ACCEPT_ANYWAY  = 'M3 7l3 3 5-6';
const ICON_END_CALL       = 'M2 5l10 5 M2 10l10-5';

export const NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  'sip-trunk': {
    type: 'sip-trunk', label: 'SIP Trunk', color: '#3B82F6',
    iconPath: ICON_SIP_TRUNK,
    hasOutputPort: true, hasExtensionNumber: false, paletteSection: 'call-flow',
  },
  'did': {
    type: 'did', label: 'DID', color: '#22C55E',
    iconPath: ICON_DID,
    hasOutputPort: true, hasExtensionNumber: false, paletteSection: 'call-flow',
  },
  'ivr': {
    type: 'ivr', label: 'IVR', color: '#F59E0B',
    iconPath: ICON_IVR,
    hasOutputPort: true, hasExtensionNumber: true, paletteSection: 'call-flow',
  },
  'ring-group': {
    type: 'ring-group', label: 'Ring Group', color: '#06B6D4',
    iconPath: ICON_RING_GROUP,
    hasOutputPort: true, hasExtensionNumber: true, paletteSection: 'call-flow',
  },
  'call-queue': {
    type: 'call-queue', label: 'Call Queue', color: '#8B5CF6',
    iconPath: ICON_CALL_QUEUE,
    hasOutputPort: true, hasExtensionNumber: true, paletteSection: 'call-flow',
  },
  'extension': {
    type: 'extension', label: 'Extension', color: '#6B7280',
    iconPath: ICON_EXTENSION,
    hasOutputPort: false, hasExtensionNumber: true, paletteSection: 'call-flow',
  },
  'voicemail': {
    type: 'voicemail', label: 'Voicemail', color: '#a78bfa',
    iconPath: ICON_VOICEMAIL,
    hasOutputPort: false, hasExtensionNumber: true, paletteSection: 'destinations',
  },
  'call-processing-script': {
    type: 'call-processing-script', label: 'Call Processing Script', color: '#ec4899',
    iconPath: ICON_CALL_PROCESSING_SCRIPT,
    hasOutputPort: false, hasExtensionNumber: false, paletteSection: 'destinations',
  },
  'external-number': {
    type: 'external-number', label: 'External Number', color: '#f97316',
    iconPath: ICON_EXTERNAL,
    hasOutputPort: false, hasExtensionNumber: false, paletteSection: 'destinations',
  },
  'accept-anyway': {
    type: 'accept-anyway', label: 'Accept Anyway', color: '#16a34a',
    iconPath: ICON_ACCEPT_ANYWAY,
    hasOutputPort: false, hasExtensionNumber: false, paletteSection: 'destinations',
    isTerminal: true,
  },
  'end-call': {
    type: 'end-call', label: 'End Call', color: '#dc2626',
    iconPath: ICON_END_CALL,
    hasOutputPort: false, hasExtensionNumber: false, paletteSection: 'destinations',
    isTerminal: true,
  },
};

export interface ExtensionEntry {
  number: string;
  firstName: string;
  lastName: string;
}

export const EXTENSIONS: ExtensionEntry[] = [
  { number: '100', firstName: 'John', lastName: 'Smith' },
  { number: '101', firstName: 'Jane', lastName: 'Doe' },
  { number: '102', firstName: 'Mike', lastName: 'Johnson' },
  { number: '103', firstName: 'Sarah', lastName: 'Williams' },
  { number: '104', firstName: 'David', lastName: 'Brown' },
  { number: '105', firstName: 'Emily', lastName: 'Davis' },
  { number: '106', firstName: 'Chris', lastName: 'Miller' },
  { number: '107', firstName: 'Lisa', lastName: 'Wilson' },
  { number: '108', firstName: 'Tom', lastName: 'Moore' },
  { number: '109', firstName: 'Amy', lastName: 'Taylor' },
  { number: '110', firstName: 'Dan', lastName: 'Anderson' },
  { number: '111', firstName: 'Rachel', lastName: 'Thomas' },
];
