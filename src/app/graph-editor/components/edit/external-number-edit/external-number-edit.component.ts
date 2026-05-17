import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExternalNumber } from '../../../models/externalNumber';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';

@Component({
  selector: 'app-external-number-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent],
  template: `
    <app-edit-shell title="Edit External Number" (save)="onSave()" (cancel)="onCancel()">
      <app-form-field label="Number">
        <input type="text" [(ngModel)]="model().number" />
      </app-form-field>
      <app-form-field label="Label">
        <input type="text"
               [ngModel]="model().label ?? ''"
               (ngModelChange)="model().label = $event || null" />
      </app-form-field>
    </app-edit-shell>
  `,
})
export class ExternalNumberEditComponent {
  readonly model = input.required<ExternalNumber>();
  readonly save = output<ExternalNumber>();
  readonly cancel = output<void>();
  onSave(): void { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }
}
