import { UpdateNodeDataCommand } from './update-node-data.command';
import { createDefaultNodeData } from '../models/node-data.factory';
import { Graph, Vertex } from '../models/graph.models';
import { RingGroup } from '../models/ringGroup';

const baseNode: Vertex = {
  id: 'n1', type: 'ring-group', label: 'Old', x: 0, y: 0, width: 160, height: 75,
};
const otherNode: Vertex = {
  id: 'n2', type: 'sip-trunk', label: 'Other', x: 0, y: 0, width: 160, height: 59,
};

describe('UpdateNodeDataCommand', () => {
  it('sets data on the target node', () => {
    const newData = createDefaultNodeData('ring-group', { extensionNumber: '801', label: 'Sales' });
    const cmd = new UpdateNodeDataCommand('n1', undefined, newData);
    const state: Graph = { nodes: [baseNode, otherNode] };
    const next = cmd.execute(state);
    expect(next.nodes.find(n => n.id === 'n1')!.data).toBe(newData);
    expect(next.nodes.find(n => n.id === 'n2')).toEqual(otherNode);
  });

  it('re-derives label on execute', () => {
    const newData = createDefaultNodeData('ring-group', { extensionNumber: '801', label: 'Sales' });
    const cmd = new UpdateNodeDataCommand('n1', undefined, newData);
    const state: Graph = { nodes: [baseNode] };
    const next = cmd.execute(state);
    expect(next.nodes[0].label).toBe('801 - Sales');
  });

  it('keeps existing label when derived label is null', () => {
    const newData = createDefaultNodeData('ring-group') as RingGroup;
    const cmd = new UpdateNodeDataCommand('n1', undefined, newData);
    const next = cmd.execute({ nodes: [baseNode] });
    expect(next.nodes[0].label).toBe('Old');
  });

  it('restores old data and re-derives label on undo', () => {
    const oldData = createDefaultNodeData('ring-group', { extensionNumber: '700', label: 'Old' });
    const newData = createDefaultNodeData('ring-group', { extensionNumber: '801', label: 'Sales' });
    const cmd = new UpdateNodeDataCommand('n1', oldData, newData);
    const after = cmd.execute({ nodes: [{ ...baseNode, data: oldData, label: '700 - Old' }] });
    const undone = cmd.undo(after);
    expect(undone.nodes[0].data).toBe(oldData);
    expect(undone.nodes[0].label).toBe('700 - Old');
  });

  it('undo with undefined oldData clears data', () => {
    const newData = createDefaultNodeData('ring-group', { extensionNumber: '801', label: 'Sales' });
    const cmd = new UpdateNodeDataCommand('n1', undefined, newData);
    const after = cmd.execute({ nodes: [baseNode] });
    const undone = cmd.undo(after);
    expect(undone.nodes[0].data).toBeUndefined();
    expect(undone.nodes[0].label).toBe('Old');
  });

  it('is a no-op for unknown nodeId', () => {
    const newData = createDefaultNodeData('ring-group');
    const cmd = new UpdateNodeDataCommand('missing', undefined, newData);
    const state: Graph = { nodes: [baseNode] };
    const next = cmd.execute(state);
    expect(next.nodes).toEqual([baseNode]);
  });
});
