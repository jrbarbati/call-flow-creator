import {
  NodeType, NODE_TYPES, NodeTypeConfig, NODE_TYPE_CONFIGS,
  EXTENSIONS, ExtensionEntry
} from './node-types';

describe('Node Type Registry', () => {
  it('NODE_TYPES contains all 6 types', () => {
    expect(NODE_TYPES).toEqual([
      'sip-trunk', 'did', 'ivr', 'ring-group', 'call-queue', 'extension'
    ]);
  });

  it('NODE_TYPE_CONFIGS has entry for every type', () => {
    for (const t of NODE_TYPES) {
      expect(NODE_TYPE_CONFIGS[t]).toBeDefined();
      expect(NODE_TYPE_CONFIGS[t].type).toBe(t);
      expect(NODE_TYPE_CONFIGS[t].label).toBeTruthy();
      expect(NODE_TYPE_CONFIGS[t].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(NODE_TYPE_CONFIGS[t].iconPath).toBeTruthy();
      expect(typeof NODE_TYPE_CONFIGS[t].hasOutputPort).toBe('boolean');
      expect(typeof NODE_TYPE_CONFIGS[t].hasExtensionNumber).toBe('boolean');
    }
  });

  it('ivr, ring-group, call-queue, extension have extension numbers', () => {
    expect(NODE_TYPE_CONFIGS['ivr'].hasExtensionNumber).toBe(true);
    expect(NODE_TYPE_CONFIGS['ring-group'].hasExtensionNumber).toBe(true);
    expect(NODE_TYPE_CONFIGS['call-queue'].hasExtensionNumber).toBe(true);
    expect(NODE_TYPE_CONFIGS['extension'].hasExtensionNumber).toBe(true);
  });

  it('sip-trunk, did do not have extension numbers', () => {
    expect(NODE_TYPE_CONFIGS['sip-trunk'].hasExtensionNumber).toBe(false);
    expect(NODE_TYPE_CONFIGS['did'].hasExtensionNumber).toBe(false);
  });

  it('extension type has no output port', () => {
    expect(NODE_TYPE_CONFIGS['extension'].hasOutputPort).toBe(false);
  });

  it('all non-extension types have output port', () => {
    const nonExt = NODE_TYPES.filter(t => t !== 'extension');
    for (const t of nonExt) {
      expect(NODE_TYPE_CONFIGS[t].hasOutputPort).toBe(true);
    }
  });
});

describe('Extension Seed Data', () => {
  it('EXTENSIONS has 12 entries', () => {
    expect(EXTENSIONS).toHaveLength(12);
  });

  it('each extension has number, firstName, lastName', () => {
    for (const ext of EXTENSIONS) {
      expect(ext.number).toMatch(/^\d{3}$/);
      expect(ext.firstName).toBeTruthy();
      expect(ext.lastName).toBeTruthy();
    }
  });

  it('extension numbers are unique', () => {
    const numbers = EXTENSIONS.map(e => e.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});
