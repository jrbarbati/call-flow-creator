import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Voicemail } from '../../../models/voicemail';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';

@Component({
  selector: 'app-voicemail-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent],
  template: `
    <app-edit-shell title="Edit Voicemail" (save)="onSave()" (cancel)="onCancel()">
      <app-form-field label="Owner Extension Number">
        <input type="text" [(ngModel)]="model().extensionNumber" />
      </app-form-field>
      <app-form-field label="Display Name">
        <input type="text" [(ngModel)]="model().name" />
      </app-form-field>
    </app-edit-shell>
  `,
})
export class VoicemailEditComponent {
  readonly model = input.required<Voicemail>();
  readonly save = output<Voicemail>();
  readonly cancel = output<void>();
  onSave(): void { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }
}
