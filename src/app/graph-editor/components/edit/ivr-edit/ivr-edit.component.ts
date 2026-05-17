import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ivr, IvrDestination, IvrForward } from '../../../models/ivr';
import { DestinationTrigger } from '../../../models/ringGroup';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';
import { SelectFieldComponent, SelectOption } from '../_shared/select-field.component';
import { RowListComponent } from '../_shared/row-list.component';
import { DestinationEditorComponent } from '../_shared/destination-editor/destination-editor.component';

const FORWARD_TYPES: SelectOption[] = [
  { value: 'extension', label: 'Extension' },
  { value: 'ringgroup', label: 'Ring Group' },
  { value: 'queue',     label: 'Queue' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'external',  label: 'External' },
];

@Component({
  selector: 'app-ivr-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent, SelectFieldComponent, RowListComponent, DestinationEditorComponent],
  templateUrl: './ivr-edit.component.html',
  styleUrl: './ivr-edit.component.scss',
})
export class IvrEditComponent {
  readonly model = input.required<Ivr>();
  readonly save   = output<Ivr>();
  readonly cancel = output<void>();

  protected readonly forwardTypes = FORWARD_TYPES;
  protected readonly triggers = [
    DestinationTrigger.OFFICE_CLOSED,
    DestinationTrigger.BREAK,
    DestinationTrigger.HOLIDAY,
  ];

  onSave(): void   { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }

  destinationFor(trigger: DestinationTrigger): IvrDestination {
    const m = this.model();
    switch (trigger) {
      case DestinationTrigger.OFFICE_CLOSED: return m.destinationOfficeClosed;
      case DestinationTrigger.BREAK:         return m.destinationBreak;
      case DestinationTrigger.HOLIDAY:       return m.destinationHoliday;
      default: return m.destinationOfficeClosed;
    }
  }

  onDestinationChange(trigger: DestinationTrigger, dest: IvrDestination): void {
    const m = this.model();
    dest.trigger = trigger;
    switch (trigger) {
      case DestinationTrigger.OFFICE_CLOSED: m.destinationOfficeClosed = dest; break;
      case DestinationTrigger.BREAK:         m.destinationBreak = dest; break;
      case DestinationTrigger.HOLIDAY:       m.destinationHoliday = dest; break;
    }
    m.destinations = (m.destinations ?? []).filter(d => d.trigger !== trigger);
    m.destinations.push(dest);
  }

  onAddForward(): void {
    const f: IvrForward = {
      id: null,
      ivrId: null,
      type: 'extension',
      input: '',
      peerType: null,
      destination: '',
      tcxId: null,
      customData: null,
    };
    this.model().forwards.push(f);
  }

  onRemoveForward(index: number): void {
    this.model().forwards.splice(index, 1);
  }
}
