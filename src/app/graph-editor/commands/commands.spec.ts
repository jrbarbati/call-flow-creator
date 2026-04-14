import { AddNodeCommand } from './add-node.command';
import { MoveNodeCommand } from './move-node.command';
import { RenameNodeCommand } from './rename-node.command';
import { DeleteNodeCommand } from './delete-node.command';
import { AddEdgeCommand } from './add-edge.command';
import { DeleteEdgeCommand } from './delete-edge.command';
import { GraphState, NodeModel, EdgeModel } from '../models/graph.models';

const node1: NodeModel = { id: 'n1', type: 'sip-trunk', label: 'A', x: 10, y: 20, width: 160, height: 48 };
const node2: NodeModel = { id: 'n2', type: 'did', label: 'B', x: 200, y: 20, width: 160, height: 48 };
const edge1: EdgeModel = { id: 'e1', sourceId: 'n1', targetId: 'n2' };

const emptyState: GraphState = { nodes: [], edges: [] };
const stateWithNodes: GraphState = { nodes: [node1, node2], edges: [] };
const stateWithEdge: GraphState = { nodes: [node1, node2], edges: [edge1] };

describe('AddNodeCommand', () => {
  it('adds a node on execute', () => {
    const cmd = new AddNodeCommand(node1);
    const result = cmd.execute(emptyState);
    expect(result.nodes).toEqual([node1]);
    expect(result.edges).toEqual([]);
  });

  it('removes the node on undo', () => {
    const cmd = new AddNodeCommand(node1);
    const executed = cmd.execute(emptyState);
    const undone = cmd.undo(executed);
    expect(undone.nodes).toEqual([]);
  });

  it('does not mutate original state', () => {
    const cmd = new AddNodeCommand(node1);
    cmd.execute(emptyState);
    expect(emptyState.nodes).toEqual([]);
  });
});

describe('MoveNodeCommand', () => {
  it('moves node to new position on execute', () => {
    const cmd = new MoveNodeCommand('n1', { x: 10, y: 20 }, { x: 50, y: 80 });
    const result = cmd.execute(stateWithNodes);
    const moved = result.nodes.find(n => n.id === 'n1')!;
    expect(moved.x).toBe(50);
    expect(moved.y).toBe(80);
  });

  it('restores original position on undo', () => {
    const cmd = new MoveNodeCommand('n1', { x: 10, y: 20 }, { x: 50, y: 80 });
    const executed = cmd.execute(stateWithNodes);
    const undone = cmd.undo(executed);
    const restored = undone.nodes.find(n => n.id === 'n1')!;
    expect(restored.x).toBe(10);
    expect(restored.y).toBe(20);
  });
});

describe('RenameNodeCommand', () => {
  it('renames node on execute', () => {
    const cmd = new RenameNodeCommand('n1', 'A', 'New Label');
    const result = cmd.execute(stateWithNodes);
    expect(result.nodes.find(n => n.id === 'n1')!.label).toBe('New Label');
  });

  it('restores original label on undo', () => {
    const cmd = new RenameNodeCommand('n1', 'A', 'New Label');
    const executed = cmd.execute(stateWithNodes);
    const undone = cmd.undo(executed);
    expect(undone.nodes.find(n => n.id === 'n1')!.label).toBe('A');
  });
});

describe('DeleteNodeCommand', () => {
  it('removes node and its connected edges on execute', () => {
    const cmd = new DeleteNodeCommand(node1, [edge1]);
    const result = cmd.execute(stateWithEdge);
    expect(result.nodes.find(n => n.id === 'n1')).toBeUndefined();
    expect(result.edges).toEqual([]);
  });

  it('restores node and edges on undo', () => {
    const cmd = new DeleteNodeCommand(node1, [edge1]);
    const executed = cmd.execute(stateWithEdge);
    const undone = cmd.undo(executed);
    expect(undone.nodes.find(n => n.id === 'n1')).toEqual(node1);
    expect(undone.edges).toEqual([edge1]);
  });
});

describe('AddEdgeCommand', () => {
  it('adds an edge on execute', () => {
    const cmd = new AddEdgeCommand(edge1);
    const result = cmd.execute(stateWithNodes);
    expect(result.edges).toEqual([edge1]);
  });

  it('removes edge on undo', () => {
    const cmd = new AddEdgeCommand(edge1);
    const executed = cmd.execute(stateWithNodes);
    const undone = cmd.undo(executed);
    expect(undone.edges).toEqual([]);
  });
});

describe('DeleteEdgeCommand', () => {
  it('removes edge on execute', () => {
    const cmd = new DeleteEdgeCommand(edge1);
    const result = cmd.execute(stateWithEdge);
    expect(result.edges).toEqual([]);
  });

  it('restores edge on undo', () => {
    const cmd = new DeleteEdgeCommand(edge1);
    const executed = cmd.execute(stateWithEdge);
    const undone = cmd.undo(executed);
    expect(undone.edges).toEqual([edge1]);
  });
});
