import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphPaletteComponent } from './graph-palette.component';
import { vi } from 'vitest';

describe('GraphPaletteComponent', () => {
  let fixture: ComponentFixture<GraphPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphPaletteComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GraphPaletteComponent);
    fixture.detectChanges();
  });

  it('renders the palette sidebar', () => {
    const aside = fixture.nativeElement.querySelector('.palette');
    expect(aside).toBeTruthy();
  });

  it('renders 3CX ASSETS section with 5 items', () => {
    const header = fixture.nativeElement.querySelector('.palette-section-header');
    expect(header.textContent).toContain('3CX ASSETS');
    const items = fixture.nativeElement.querySelectorAll('.component-item');
    expect(items.length).toBe(5);
  });

  it('renders EXTENSIONS section with 12 items', () => {
    const headers = fixture.nativeElement.querySelectorAll('.palette-section-header');
    const extHeader = Array.from(headers).find((h: any) => h.textContent.includes('EXTENSIONS'));
    expect(extHeader).toBeTruthy();
    const items = fixture.nativeElement.querySelectorAll('.extension-item');
    expect(items.length).toBe(12);
  });

  it('component items have correct data-type attributes', () => {
    const types = ['sip-trunk', 'did', 'ivr', 'ring-group', 'call-queue'];
    for (const t of types) {
      const item = fixture.nativeElement.querySelector(`[data-type="${t}"]`);
      expect(item).toBeTruthy();
    }
  });

  it('component item sets node-type on dragstart', () => {
    const item = fixture.nativeElement.querySelector('[data-type="sip-trunk"]');
    const setData = vi.fn();
    const dt = { setData, effectAllowed: '' };
    const event = new Event('dragstart', { bubbles: true }) as any;
    event.dataTransfer = dt;
    item.dispatchEvent(event);
    expect(setData).toHaveBeenCalledWith('node-type', 'sip-trunk');
  });

  it('extension item sets node-type and extension-data on dragstart', () => {
    const item = fixture.nativeElement.querySelector('.extension-item');
    const setData = vi.fn();
    const dt = { setData, effectAllowed: '' };
    const event = new Event('dragstart', { bubbles: true }) as any;
    event.dataTransfer = dt;
    item.dispatchEvent(event);
    expect(setData).toHaveBeenCalledWith('node-type', 'extension');
    expect(setData).toHaveBeenCalledWith('extension-data', expect.any(String));
    const extData = JSON.parse(setData.mock.calls.find((c: any) => c[0] === 'extension-data')![1]);
    expect(extData.number).toBeTruthy();
    expect(extData.firstName).toBeTruthy();
    expect(extData.lastName).toBeTruthy();
  });
});
