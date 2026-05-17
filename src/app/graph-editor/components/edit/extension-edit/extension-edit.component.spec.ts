import { TestBed } from '@angular/core/testing';
import { ExtensionEditComponent } from './extension-edit.component';
import { createDefaultNodeData } from '../../../models/node-data.factory';
import { Extension } from '../../../models/extension';

describe('ExtensionEditComponent', () => {
  it('emits save with mutated model', () => {
    const fixture = TestBed.createComponent(ExtensionEditComponent);
    const seed = createDefaultNodeData('extension', { extensionNumber: '100', firstName: 'A', lastName: 'B' }) as Extension;
    fixture.componentRef.setInput('model', seed);
    fixture.detectChanges();
    let emitted: Extension | undefined;
    fixture.componentInstance.save.subscribe(m => emitted = m);
    fixture.componentInstance.model().mobile = '555-1234';
    fixture.componentInstance.onSave();
    expect(emitted!.mobile).toBe('555-1234');
  });
});
