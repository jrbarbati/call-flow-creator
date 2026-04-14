import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphEditorComponent } from './graph-editor.component';
import { GraphModel } from './models/graph.models';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const emptyGraph: GraphModel = { nodes: [], edges: [] };
const testGraph: GraphModel = {
  nodes: [{ id: 'n1', label: 'A', x: 0, y: 0, width: 160, height: 48 }],
  edges: [],
};

describe('GraphEditorComponent', () => {
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphEditorComponent);
  });

  it('renders palette and canvas elements', () => {
    fixture.componentRef.setInput('graph', emptyGraph);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-graph-palette')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-graph-canvas')).toBeTruthy();
  });

  it('loads @Input graph into service on init', () => {
    fixture.componentRef.setInput('graph', testGraph);
    fixture.detectChanges();
    const service = fixture.componentInstance['service'];
    expect(service.nodes()[0].id).toBe('n1');
  });

  it('emits graphChange when service executes a command', async () => {
    fixture.componentRef.setInput('graph', emptyGraph);
    fixture.detectChanges();

    const emitted: GraphModel[] = [];
    fixture.componentInstance.graphChange.subscribe((g: GraphModel) => emitted.push(g));

    const service = fixture.componentInstance['service'];
    const { AddNodeCommand } = await import('./commands/add-node.command');
    service.execute(new AddNodeCommand({ id: 'n2', label: 'B', x: 0, y: 0, width: 160, height: 48 }));

    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted[emitted.length - 1].nodes.some((n: any) => n.id === 'n2')).toBe(true);
  });

  it('emits graphChange when service undoes a command', async () => {
    fixture.componentRef.setInput('graph', emptyGraph);
    fixture.detectChanges();

    const { AddNodeCommand } = await import('./commands/add-node.command');
    const service = fixture.componentInstance['service'];
    service.execute(new AddNodeCommand({ id: 'n3', label: 'C', x: 0, y: 0, width: 160, height: 48 }));

    const emitted: GraphModel[] = [];
    fixture.componentInstance.graphChange.subscribe((g: GraphModel) => emitted.push(g));

    service.undo();

    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted[emitted.length - 1].nodes.some((n: any) => n.id === 'n3')).toBe(false);
  });
});
