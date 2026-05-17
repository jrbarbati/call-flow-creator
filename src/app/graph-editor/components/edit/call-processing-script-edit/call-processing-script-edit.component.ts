import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CallProcessingScript } from '../../../models/callProcessingScript';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';

@Component({
  selector: 'app-call-processing-script-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent],
  template: `
    <app-edit-shell title="Edit Call Processing Script" (save)="onSave()" (cancel)="onCancel()">
      <app-form-field label="Name">
        <input type="text" [(ngModel)]="model().name" />
      </app-form-field>
      <app-form-field label="App ID">
        <input type="text"
               [ngModel]="model().appId ?? ''"
               (ngModelChange)="model().appId = $event || null" />
      </app-form-field>
    </app-edit-shell>
  `,
})
export class CallProcessingScriptEditComponent {
  readonly model = input.required<CallProcessingScript>();
  readonly save = output<CallProcessingScript>();
  readonly cancel = output<void>();
  onSave(): void { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }
}
