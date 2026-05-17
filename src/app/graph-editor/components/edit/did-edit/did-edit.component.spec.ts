import { TestBed } from '@angular/core/testing';
import { DidEditComponent } from './did-edit.component';
import { createDefaultNodeData } from '../../../models/node-data.factory';
import { DidNumber } from '../../../models/didNumber';

describe('DidEditComponent', () => {
  it('emits save with mutated model', () => {
    const fixture = TestBed.createComponent(DidEditComponent);
    const seed = createDefaultNodeData('did') as DidNumber;
    fixture.componentRef.setInput('model', seed);
    fixture.detectChanges();
    let emitted: DidNumber | undefined;
    fixture.componentInstance.save.subscribe(m => emitted = m);
    fixture.componentInstance.model().number = '+15555550000';
    fixture.componentInstance.onSave();
    expect(emitted!.number).toBe('+15555550000');
  });
});
