import { TestBed } from '@angular/core/testing';
import { RingGroupEditComponent } from './ring-group-edit.component';
import { createDefaultNodeData } from '../../../models/node-data.factory';
import { RingGroup } from '../../../models/ringGroup';

describe('RingGroupEditComponent', () => {
  it('emits save with mutated model', () => {
    const fixture = TestBed.createComponent(RingGroupEditComponent);
    const seed = createDefaultNodeData('ring-group', { extensionNumber: '801', label: 'Sales' }) as RingGroup;
    fixture.componentRef.setInput('model', seed);
    fixture.detectChanges();

    let emitted: RingGroup | undefined;
    fixture.componentInstance.save.subscribe(m => emitted = m);
    fixture.componentInstance.model().ringTime = 30;
    fixture.componentInstance.onSave();

    expect(emitted).toBeDefined();
    expect(emitted!.ringTime).toBe(30);
    expect(emitted!.extensionNumber).toBe('801');
  });

  it('emits cancel', () => {
    const fixture = TestBed.createComponent(RingGroupEditComponent);
    const seed = createDefaultNodeData('ring-group') as RingGroup;
    fixture.componentRef.setInput('model', seed);
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => cancelled = true);
    fixture.componentInstance.onCancel();
    expect(cancelled).toBe(true);
  });
});
