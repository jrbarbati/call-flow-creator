import { TestBed } from '@angular/core/testing';
import { IvrEditComponent } from './ivr-edit.component';
import { createDefaultNodeData } from '../../../models/node-data.factory';
import { Ivr } from '../../../models/ivr';

describe('IvrEditComponent', () => {
  it('emits save with mutated model', () => {
    const fixture = TestBed.createComponent(IvrEditComponent);
    const seed = createDefaultNodeData('ivr', { extensionNumber: '900', label: 'Main' }) as Ivr;
    fixture.componentRef.setInput('model', seed);
    fixture.detectChanges();

    let emitted: Ivr | undefined;
    fixture.componentInstance.save.subscribe(m => emitted = m);
    fixture.componentInstance.model().timeout = 25;
    fixture.componentInstance.onSave();

    expect(emitted!.timeout).toBe(25);
  });
});
