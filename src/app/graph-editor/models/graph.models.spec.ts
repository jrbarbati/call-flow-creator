import { GraphModel, NodeModel, EdgeModel } from './graph.models';

describe('GraphModel types', () => {
  it('should construct a valid NodeModel with defaults', () => {
    const node: NodeModel = {
      id: 'n1',
      type: 'sip-trunk',
      label: 'Test Node',
      x: 0,
      y: 0,
      width: 160,
      height: 48,
    };
    expect(node.id).toBe('n1');
    expect(node.type).toBe('sip-trunk');
    expect(node.meta).toBeUndefined();
  });

  it('should construct a valid EdgeModel', () => {
    const edge: EdgeModel = {
      id: 'e1',
      sourceId: 'n1',
      targetId: 'n2',
    };
    expect(edge.label).toBeUndefined();
    expect(edge.meta).toBeUndefined();
  });

  it('should construct a valid GraphModel', () => {
    const graph: GraphModel = { nodes: [], edges: [] };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });
});
