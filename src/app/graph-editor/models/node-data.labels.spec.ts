import { deriveLabel } from './node-data.labels';
import { createDefaultNodeData } from './node-data.factory';
import { RingGroup } from './ringGroup';
import { Extension } from './extension';
import { DidNumber } from './didNumber';
import { SipTrunk } from './sipTrunk';

describe('deriveLabel', () => {
  it('formats ring-group as "{ext} - {name}"', () => {
    const rg = createDefaultNodeData('ring-group', { extensionNumber: '801', label: 'Sales' }) as RingGroup;
    expect(deriveLabel('ring-group', rg)).toBe('801 - Sales');
  });

  it('formats call-queue as "{ext} - {name}"', () => {
    const q = createDefaultNodeData('call-queue', { extensionNumber: '802', label: 'Support' });
    expect(deriveLabel('call-queue', q)).toBe('802 - Support');
  });

  it('formats ivr as "{ext} - {name}"', () => {
    const i = createDefaultNodeData('ivr', { extensionNumber: '900', label: 'Main IVR' });
    expect(deriveLabel('ivr', i)).toBe('900 - Main IVR');
  });

  it('formats extension as "{num} - {firstName} {lastName}"', () => {
    const e = createDefaultNodeData('extension', { extensionNumber: '105', firstName: 'Joe', lastName: 'Smith' }) as Extension;
    expect(deriveLabel('extension', e)).toBe('105 - Joe Smith');
  });

  it('formats did as the number', () => {
    const d = createDefaultNodeData('did') as DidNumber;
    d.number = '+15555551234';
    expect(deriveLabel('did', d)).toBe('+15555551234');
  });

  it('formats sip-trunk as name', () => {
    const t = createDefaultNodeData('sip-trunk', { label: 'Primary SIP' }) as SipTrunk;
    expect(deriveLabel('sip-trunk', t)).toBe('Primary SIP');
  });

  it('returns null when fields are empty', () => {
    const rg = createDefaultNodeData('ring-group') as RingGroup;
    expect(deriveLabel('ring-group', rg)).toBeNull();
  });
});
