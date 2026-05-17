import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DidNumber, DidNumberDestination } from '../../../models/didNumber';
import { DestinationTrigger } from '../../../models/ringGroup';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';
import { DestinationEditorComponent } from '../_shared/destination-editor/destination-editor.component';

@Component({
  selector: 'app-did-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent, DestinationEditorComponent],
  templateUrl: './did-edit.component.html',
  styleUrl: './did-edit.component.scss',
})
export class DidEditComponent {
  readonly model = input.required<DidNumber>();
  readonly save   = output<DidNumber>();
  readonly cancel = output<void>();

  protected readonly triggers = [
    DestinationTrigger.DEFAULT_ROUTE,
    DestinationTrigger.OFFICE_CLOSED,
    DestinationTrigger.HOLIDAY,
  ];

  onSave(): void   { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }

  destinationFor(trigger: DestinationTrigger): DidNumberDestination {
    const m = this.model();
    switch (trigger) {
      case DestinationTrigger.DEFAULT_ROUTE: return m.destinationOfficeHours;
      case DestinationTrigger.OFFICE_CLOSED: return m.destinationOfficeClosed;
      case DestinationTrigger.HOLIDAY:       return m.destinationHoliday;
      default: return m.destinationOfficeHours;
    }
  }

  onDestinationChange(trigger: DestinationTrigger, dest: DidNumberDestination): void {
    const m = this.model();
    dest.trigger = trigger;
    switch (trigger) {
      case DestinationTrigger.DEFAULT_ROUTE: m.destinationOfficeHours = dest; break;
      case DestinationTrigger.OFFICE_CLOSED: m.destinationOfficeClosed = dest; break;
      case DestinationTrigger.HOLIDAY:       m.destinationHoliday = dest; break;
    }
  }
}
