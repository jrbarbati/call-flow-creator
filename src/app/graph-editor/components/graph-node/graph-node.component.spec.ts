import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GraphNodeComponent } from './graph-node.component';
import { GraphEditorService } from '../../graph-editor.service';
import { Vertex } from '../../models/graph.models';
import { vi } from 'vitest';

const node: Vertex = { id: 'n1', type: 'extension', label: 'Test', x: 50, y: 80, width: 160, height: 48 };

describe('GraphNodeComponent', () => {
  let fixture: ComponentFixture<GraphNodeComponent>;
  let service: GraphEditorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphNodeComponent],
      providers: [GraphEditorService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    service = TestBed.inject(GraphEditorService);
    fixture = TestBed.createComponent(GraphNodeComponent);
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
  });

  it('renders node SVG group at correct position', () => {
    const g = fixture.nativeElement.querySelector('g.graph-node');
    expect(g).toBeTruthy();
    expect(g.getAttribute('transform')).toBe('translate(50,80)');
  });

  it('displays node label', () => {
    const text = fixture.nativeElement.querySelector('.node-label');
    expect(text).toBeTruthy();
    expect(text.textContent.trim()).toBe('Test');
  });

  it('applies selected class when node is in selectedIds', () => {
    service.selectedIds.set(new Set(['n1']));
    fixture.detectChanges();
    const rect = fixture.nativeElement.querySelector('.node-rect');
    expect(rect.classList).toContain('is-selected');
  });

  it('emits portDragStart on port handle mousedown', () => {
    // Re-create fixture with a node type that has an output port
    fixture.componentRef.setInput('node', { ...node, type: 'sip-trunk' });
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.portDragStart.subscribe(spy);
    // Toggle hover state so port handle renders
    (fixture.componentInstance as any).isHovered.set(true);
    fixture.detectChanges();
    const port = fixture.nativeElement.querySelector('.port-handle');
    port.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('emits nodeDropTarget on node mouseup', () => {
    const spy = vi.fn();
    fixture.componentInstance.nodeDropTarget.subscribe(spy);
    const g = fixture.nativeElement.querySelector('g.graph-node');
    g.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith(node);
  });
});
