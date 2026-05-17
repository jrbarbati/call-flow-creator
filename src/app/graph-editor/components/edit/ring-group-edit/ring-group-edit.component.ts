import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RingGroup, RingGroupDestination, RingGroupMember, DestinationTrigger } from '../../../models/ringGroup';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';
import { SelectFieldComponent, SelectOption } from '../_shared/select-field.component';
import { RowListComponent } from '../_shared/row-list.component';
import { DestinationEditorComponent } from '../_shared/destination-editor/destination-editor.component';

const RING_STRATEGIES: SelectOption[] = [
  { value: 'prioritized', label: 'Prioritized Hunt' },
  { value: 'ringall',     label: 'Ring All' },
  { value: 'paging',      label: 'Paging' },
  { value: 'hunt',        label: 'Hunt' },
];

@Component({
  selector: 'app-ring-group-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent, SelectFieldComponent, RowListComponent, DestinationEditorComponent],
  templateUrl: './ring-group-edit.component.html',
  styleUrl: './ring-group-edit.component.scss',
})
export class RingGroupEditComponent {
  readonly model = input.required<RingGroup>();
  readonly save   = output<RingGroup>();
  readonly cancel = output<void>();

  protected readonly strategies = RING_STRATEGIES;
  protected readonly triggers = [
    DestinationTrigger.NO_ANSWER,
    DestinationTrigger.OFFICE_CLOSED,
    DestinationTrigger.BREAK,
    DestinationTrigger.HOLIDAY,
  ];

  onSave(): void   { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }

  destinationFor(trigger: DestinationTrigger): RingGroupDestination {
    const m = this.model();
    switch (trigger) {
      case DestinationTrigger.NO_ANSWER:     return m.destinationNoAnswer;
      case DestinationTrigger.OFFICE_CLOSED: return m.destinationOfficeClosed;
      case DestinationTrigger.BREAK:         return m.destinationBreak;
      case DestinationTrigger.HOLIDAY:       return m.destinationHoliday;
      default: return m.destinationNoAnswer;
    }
  }

  onDestinationChange(trigger: DestinationTrigger, dest: RingGroupDestination): void {
    const m = this.model();
    dest.trigger = trigger;
    switch (trigger) {
      case DestinationTrigger.NO_ANSWER:     m.destinationNoAnswer = dest; break;
      case DestinationTrigger.OFFICE_CLOSED: m.destinationOfficeClosed = dest; break;
      case DestinationTrigger.BREAK:         m.destinationBreak = dest; break;
      case DestinationTrigger.HOLIDAY:       m.destinationHoliday = dest; break;
    }
    m.destinations = (m.destinations ?? []).filter(d => d.trigger !== trigger);
    m.destinations.push(dest);
  }

  onAddMember(): void {
    const member: RingGroupMember = {
      id: null,
      ringGroupId: null,
      name: '',
      extensionNumber: '',
    };
    this.model().members.push(member);
  }

  onRemoveMember(index: number): void {
    this.model().members.splice(index, 1);
  }
}
