import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphEdgeComponent } from './graph-edge.component';
import { GraphEditorService } from '../../graph-editor.service';
import { Edge, Vertex } from '../../models/graph.models';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const node1: Vertex = { id: 'n1', type: 'extension', label: 'A', x: 0, y: 0, width: 160, height: 48 };
const node2: Vertex = { id: 'n2', type: 'extension', label: 'B', x: 300, y: 100, width: 160, height: 48 };
const edge: Edge = { id: 'e1', sourceId: 'n1', targetId: 'n2' };

describe('GraphEdgeComponent', () => {
  let fixture: ComponentFixture<GraphEdgeComponent>;
  let service: GraphEditorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphEdgeComponent],
      providers: [GraphEditorService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    service = TestBed.inject(GraphEditorService);
    service.loadGraph({ nodes: [node1, node2], edges: [edge] });

    fixture = TestBed.createComponent(GraphEdgeComponent);
    fixture.componentRef.setInput('edge', edge);
    fixture.detectChanges();
  });

  it('renders an SVG path with class edge-path', () => {
    const path = fixture.nativeElement.querySelector('path.edge-path');
    expect(path).toBeTruthy();
  });

  it('edge-path has a non-empty d attribute when nodes exist', () => {
    const path = fixture.nativeElement.querySelector('path.edge-path');
    expect(path.getAttribute('d')).toBeTruthy();
    expect(path.getAttribute('d')).not.toBe('');
  });

  it('edge-path has marker-end attribute for arrowhead', () => {
    const path = fixture.nativeElement.querySelector('path.edge-path');
    expect(path.getAttribute('marker-end')).toContain('arrowhead');
  });

  it('applies is-selected class when edge id is in selectedIds', () => {
    service.selectedIds.set(new Set(['e1']));
    fixture.detectChanges();
    const path = fixture.nativeElement.querySelector('path.edge-path');
    expect(path.classList).toContain('is-selected');
  });

  it('selects edge on click', () => {
    const path = fixture.nativeElement.querySelector('path.edge-path');
    path.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(service.selectedIds().has('e1')).toBe(true);
  });
});
