import { TestBed } from '@angular/core/testing';
import { SipTrunkEditComponent } from './sip-trunk-edit.component';
import { createDefaultNodeData } from '../../../models/node-data.factory';
import { SipTrunk } from '../../../models/sipTrunk';

describe('SipTrunkEditComponent', () => {
  it('emits save with mutated model', () => {
    const fixture = TestBed.createComponent(SipTrunkEditComponent);
    const seed = createDefaultNodeData('sip-trunk', { label: 'Primary' }) as SipTrunk;
    fixture.componentRef.setInput('model', seed);
    fixture.detectChanges();
    let emitted: SipTrunk | undefined;
    fixture.componentInstance.save.subscribe(m => emitted = m);
    fixture.componentInstance.model().server = 'sip.example.com';
    fixture.componentInstance.onSave();
    expect(emitted!.server).toBe('sip.example.com');
  });
});
