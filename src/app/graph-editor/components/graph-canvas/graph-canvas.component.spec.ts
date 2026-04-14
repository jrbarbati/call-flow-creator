import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphCanvasComponent } from './graph-canvas.component';
import { GraphEditorService } from '../../graph-editor.service';

describe('GraphCanvasComponent', () => {
  let fixture: ComponentFixture<GraphCanvasComponent>;
  let service: GraphEditorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphCanvasComponent],
      providers: [GraphEditorService],
    }).compileComponents();

    service = TestBed.inject(GraphEditorService);
    fixture = TestBed.createComponent(GraphCanvasComponent);
    fixture.detectChanges();
  });

  it('renders a canvas host div', () => {
    const host = fixture.nativeElement.querySelector('.canvas-host');
    expect(host).toBeTruthy();
  });

  it('renders an SVG element', () => {
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders a transform group', () => {
    const g = fixture.nativeElement.querySelector('svg g.canvas-transform');
    expect(g).toBeTruthy();
  });

  it('svgTransform returns correct string from viewTransform signal', () => {
    service.viewTransform.set({ x: 10, y: 20, scale: 1.5 });
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.svgTransform()).toBe('translate(10,20) scale(1.5)');
  });

  it('clears selectedIds on background SVG mousedown', () => {
    service.selectedIds.set(new Set(['n1']));
    const svg = fixture.nativeElement.querySelector('svg');
    svg.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(service.selectedIds().size).toBe(0);
  });
});
