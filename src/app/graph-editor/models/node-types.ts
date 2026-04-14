export type NodeType = 'sip-trunk' | 'did' | 'ivr' | 'ring-group' | 'call-queue' | 'extension';

export const NODE_TYPES: NodeType[] = [
  'sip-trunk', 'did', 'ivr', 'ring-group', 'call-queue', 'extension'
];

export interface NodeTypeConfig {
  type: NodeType;
  label: string;
  color: string;
  iconPath: string;
  hasOutputPort: boolean;
  hasExtensionNumber: boolean;
}

// SVG path data for 14x14 viewBox icons
const ICON_SIP_TRUNK = 'M3 1h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm1 3v2h2V4H4zm4 0v2h2V4H8zM4 8v2h2V8H4zm4 0v2h2V8H8z';
const ICON_DID = 'M4 1v12M10 1v12M1 4h12M1 10h12';
const ICON_IVR = 'M2 2h10v3H2zm0 4.5h4.5v5.5H2zm5.5 0H12v5.5H7.5z';
const ICON_RING_GROUP = 'M7 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-4.5 7.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M2 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM12 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z';
const ICON_CALL_QUEUE = 'M1 3h12M1 7h12M1 11h8M10 10l2 2 2-2';
const ICON_EXTENSION = 'M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 7c0-2.8 2.2-5 5-5s5 2.2 5 5';

export const NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  'sip-trunk': {
    type: 'sip-trunk',
    label: 'SIP Trunk',
    color: '#3B82F6',
    iconPath: ICON_SIP_TRUNK,
    hasOutputPort: true,
    hasExtensionNumber: false,
  },
  'did': {
    type: 'did',
    label: 'DID',
    color: '#22C55E',
    iconPath: ICON_DID,
    hasOutputPort: true,
    hasExtensionNumber: false,
  },
  'ivr': {
    type: 'ivr',
    label: 'IVR',
    color: '#F59E0B',
    iconPath: ICON_IVR,
    hasOutputPort: true,
    hasExtensionNumber: true,
  },
  'ring-group': {
    type: 'ring-group',
    label: 'Ring Group',
    color: '#06B6D4',
    iconPath: ICON_RING_GROUP,
    hasOutputPort: true,
    hasExtensionNumber: true,
  },
  'call-queue': {
    type: 'call-queue',
    label: 'Call Queue',
    color: '#8B5CF6',
    iconPath: ICON_CALL_QUEUE,
    hasOutputPort: true,
    hasExtensionNumber: true,
  },
  'extension': {
    type: 'extension',
    label: 'Extension',
    color: '#6B7280',
    iconPath: ICON_EXTENSION,
    hasOutputPort: false,
    hasExtensionNumber: true,
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
