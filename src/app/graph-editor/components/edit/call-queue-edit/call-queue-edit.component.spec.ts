import { TestBed } from '@angular/core/testing';
import { CallQueueEditComponent } from './call-queue-edit.component';
import { createDefaultNodeData } from '../../../models/node-data.factory';
import { CallQueue } from '../../../models/callQueue';

describe('CallQueueEditComponent', () => {
  it('emits save with mutated model', () => {
    const fixture = TestBed.createComponent(CallQueueEditComponent);
    const seed = createDefaultNodeData('call-queue', { extensionNumber: '802', label: 'Support' }) as CallQueue;
    fixture.componentRef.setInput('model', seed);
    fixture.detectChanges();

    let emitted: CallQueue | undefined;
    fixture.componentInstance.save.subscribe(m => emitted = m);
    fixture.componentInstance.model().ringTimeout = 45;
    fixture.componentInstance.onSave();

    expect(emitted!.ringTimeout).toBe(45);
  });

  it('emits cancel', () => {
    const fixture = TestBed.createComponent(CallQueueEditComponent);
    fixture.componentRef.setInput('model', createDefaultNodeData('call-queue'));
    fixture.detectChanges();
    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => cancelled = true);
    fixture.componentInstance.onCancel();
    expect(cancelled).toBe(true);
  });
});
