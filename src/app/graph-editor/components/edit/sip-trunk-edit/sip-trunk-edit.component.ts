import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SipTrunk, SipTrunkDestination } from '../../../models/sipTrunk';
import { DestinationTrigger } from '../../../models/ringGroup';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';
import { DestinationEditorComponent } from '../_shared/destination-editor/destination-editor.component';

@Component({
  selector: 'app-sip-trunk-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent, DestinationEditorComponent],
  templateUrl: './sip-trunk-edit.component.html',
  styleUrl: './sip-trunk-edit.component.scss',
})
export class SipTrunkEditComponent {
  readonly model = input.required<SipTrunk>();
  readonly save   = output<SipTrunk>();
  readonly cancel = output<void>();

  protected readonly triggers = [DestinationTrigger.DEFAULT_ROUTE];

  onSave(): void   { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }

  destinationFor(_trigger: DestinationTrigger): SipTrunkDestination {
    return this.model().defaultRoute;
  }

  onDestinationChange(trigger: DestinationTrigger, dest: SipTrunkDestination): void {
    const m = this.model();
    dest.trigger = trigger;
    m.defaultRoute = dest;
    m.destinations = (m.destinations ?? []).filter(d => d.trigger !== trigger);
    m.destinations.push(dest);
  }
}
