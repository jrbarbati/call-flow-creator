import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CallQueue, CallQueueAgent, CallQueueDestination } from '../../../models/callQueue';
import { DestinationTrigger } from '../../../models/ringGroup';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';
import { SelectFieldComponent, SelectOption } from '../_shared/select-field.component';
import { RowListComponent } from '../_shared/row-list.component';
import { DestinationEditorComponent } from '../_shared/destination-editor/destination-editor.component';

const POLLING_STRATEGIES: SelectOption[] = [
  { value: 'hunt',           label: 'Hunt' },
  { value: 'ringall',        label: 'Ring All' },
  { value: 'roundrobin',     label: 'Round Robin' },
  { value: 'longestwaiting', label: 'Longest Waiting' },
];

@Component({
  selector: 'app-call-queue-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent, SelectFieldComponent, RowListComponent, DestinationEditorComponent],
  templateUrl: './call-queue-edit.component.html',
  styleUrl: './call-queue-edit.component.scss',
})
export class CallQueueEditComponent {
  readonly model = input.required<CallQueue>();
  readonly save   = output<CallQueue>();
  readonly cancel = output<void>();

  protected readonly strategies = POLLING_STRATEGIES;
  protected readonly triggers = [
    DestinationTrigger.NO_ANSWER,
    DestinationTrigger.OFFICE_CLOSED,
    DestinationTrigger.BREAK,
    DestinationTrigger.HOLIDAY,
  ];

  onSave(): void   { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }

  destinationFor(trigger: DestinationTrigger): CallQueueDestination {
    const m = this.model();
    switch (trigger) {
      case DestinationTrigger.NO_ANSWER:     return m.destinationNoAnswer;
      case DestinationTrigger.OFFICE_CLOSED: return m.destinationOfficeClosed;
      case DestinationTrigger.BREAK:         return m.destinationBreak;
      case DestinationTrigger.HOLIDAY:       return m.destinationHoliday;
      default: return m.destinationNoAnswer;
    }
  }

  onDestinationChange(trigger: DestinationTrigger, dest: CallQueueDestination): void {
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

  onAddAgent(): void {
    const agent: CallQueueAgent = {
      id: null,
      callQueueId: null,
      tcxId: null,
      name: '',
      extensionNumber: '',
      skillGroup: '',
    };
    this.model().agents.push(agent);
  }

  onRemoveAgent(index: number): void {
    this.model().agents.splice(index, 1);
  }
}
