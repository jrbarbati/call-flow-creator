import { createDefaultNodeData } from './node-data.factory';
import { RingGroup } from './ringGroup';
import { CallQueue } from './callQueue';
import { Ivr } from './ivr';
import { DidNumber } from './didNumber';
import { Extension } from './extension';
import { SipTrunk } from './sipTrunk';

describe('createDefaultNodeData', () => {
  it('returns a RingGroup with defaults for ring-group', () => {
    const d = createDefaultNodeData('ring-group') as RingGroup;
    expect(d.id).toBe(0);
    expect(d.name).toBe('');
    expect(d.extensionNumber).toBe('');
    expect(d.members).toEqual([]);
    expect(d.assignedDids).toEqual([]);
    expect(d.ringStrategy).toBe('prioritized');
    expect(d.ringTime).toBe(20);
    expect(typeof d.createdTimestamp).toBe('number');
  });

  it('returns a CallQueue for call-queue', () => {
    const d = createDefaultNodeData('call-queue') as CallQueue;
    expect(d.agents).toEqual([]);
    expect(d.pollingStrategy).toBe('hunt');
  });

  it('returns an Ivr for ivr', () => {
    const d = createDefaultNodeData('ivr') as Ivr;
    expect(d.forwards).toEqual([]);
    expect(d.timeout).toBe(10);
    expect(d.type).toBe('standard');
  });

  it('returns a DidNumber for did', () => {
    const d = createDefaultNodeData('did') as DidNumber;
    expect(d.number).toBe('');
    expect(d.displayName).toBe('');
    expect(d.tcxTrunkId).toBe(0);
  });

  it('returns an Extension for extension', () => {
    const d = createDefaultNodeData('extension') as Extension;
    expect(d.firstName).toBe('');
    expect(d.num).toBe('');
    expect(d.phones).toEqual([]);
  });

  it('returns a SipTrunk for sip-trunk', () => {
    const d = createDefaultNodeData('sip-trunk') as SipTrunk;
    expect(d.port).toBe(5060);
    expect(d.simCalls).toBe(4);
  });

  it('applies seed.extensionNumber to ring-group', () => {
    const d = createDefaultNodeData('ring-group', { extensionNumber: '801' }) as RingGroup;
    expect(d.extensionNumber).toBe('801');
  });

  it('applies seed.label as name', () => {
    const d = createDefaultNodeData('ring-group', { label: 'Sales Ring' }) as RingGroup;
    expect(d.name).toBe('Sales Ring');
  });

  it('applies seed extension fields', () => {
    const d = createDefaultNodeData('extension', {
      extensionNumber: '105', firstName: 'Joe', lastName: 'Smith',
    }) as Extension;
    expect(d.num).toBe('105');
    expect(d.firstName).toBe('Joe');
    expect(d.lastName).toBe('Smith');
  });
});
