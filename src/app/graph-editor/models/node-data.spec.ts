import { NodeDataMap } from './node-data';
import { createDefaultNodeData } from './node-data.factory';

describe('NodeDataMap', () => {
  it('maps ring-group to a RingGroup-shaped object', () => {
    const rg: NodeDataMap['ring-group'] = createDefaultNodeData('ring-group');
    expect(rg.members).toEqual([]);
    expect(rg.ringStrategy).toBeDefined();
  });
});
