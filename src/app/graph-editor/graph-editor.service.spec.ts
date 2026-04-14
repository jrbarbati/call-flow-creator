import { TestBed } from '@angular/core/testing';
import { GraphEditorService } from './graph-editor.service';
import { AddNodeCommand } from './commands/add-node.command';
import { AddEdgeCommand } from './commands/add-edge.command';
import { NodeModel, EdgeModel, GraphModel } from './models/graph.models';

const node1: NodeModel = { id: 'n1', label: 'A', x: 0, y: 0, width: 160, height: 48 };
const node2: NodeModel = { id: 'n2', label: 'B', x: 200, y: 0, width: 160, height: 48 };
const edge1: EdgeModel = { id: 'e1', sourceId: 'n1', targetId: 'n2' };

describe('GraphEditorService', () => {
  let service: GraphEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GraphEditorService] });
    service = TestBed.inject(GraphEditorService);
  });

  it('starts with empty state', () => {
    expect(service.nodes()).toEqual([]);
    expect(service.edges()).toEqual([]);
  });

  it('executes a command and updates signals', () => {
    service.execute(new AddNodeCommand(node1));
    expect(service.nodes()).toEqual([node1]);
  });

  it('undoes the last command', () => {
    service.execute(new AddNodeCommand(node1));
    service.undo();
    expect(service.nodes()).toEqual([]);
  });

  it('redoes an undone command', () => {
    service.execute(new AddNodeCommand(node1));
    service.undo();
    service.redo();
    expect(service.nodes()).toEqual([node1]);
  });

  it('clears redo stack on new command after undo', () => {
    service.execute(new AddNodeCommand(node1));
    service.undo();
    service.execute(new AddNodeCommand(node2));
    service.redo(); // nothing to redo
    expect(service.nodes()).toEqual([node2]);
  });

  it('undo does nothing when history is empty', () => {
    expect(() => service.undo()).not.toThrow();
    expect(service.nodes()).toEqual([]);
  });

  it('redo does nothing when at end of history', () => {
    service.execute(new AddNodeCommand(node1));
    expect(() => service.redo()).not.toThrow();
    expect(service.nodes()).toEqual([node1]);
  });

  it('loadGraph replaces state without adding to history', () => {
    service.execute(new AddNodeCommand(node1));
    const graph: GraphModel = { nodes: [node2], edges: [edge1] };
    service.loadGraph(graph);
    expect(service.nodes()).toEqual([node2]);
    expect(service.edges()).toEqual([edge1]);
    service.undo(); // should not undo loadGraph
    expect(service.nodes()).toEqual([node2]);
  });

  it('screenToCanvas converts coordinates using viewTransform', () => {
    service.viewTransform.set({ x: 100, y: 50, scale: 2 });
    const result = service.screenToCanvas(300, 150);
    expect(result.x).toBe(100); // (300 - 100) / 2
    expect(result.y).toBe(50);  // (150 - 50) / 2
  });

  it('snapToGrid rounds to nearest 8px', () => {
    expect(service.snapToGrid(13)).toBe(16);
    expect(service.snapToGrid(11)).toBe(8);
    expect(service.snapToGrid(8)).toBe(8);
  });

  it('connectedEdges returns edges for a node id', () => {
    service.loadGraph({ nodes: [node1, node2], edges: [edge1] });
    expect(service.connectedEdges('n1')).toEqual([edge1]);
    expect(service.connectedEdges('n2')).toEqual([edge1]);
    expect(service.connectedEdges('n3')).toEqual([]);
  });
});
