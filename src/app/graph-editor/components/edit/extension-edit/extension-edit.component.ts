import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Extension } from '../../../models/extension';
import { EditShellComponent } from '../_shared/edit-shell.component';
import { FormFieldComponent } from '../_shared/form-field.component';

@Component({
  selector: 'app-extension-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EditShellComponent, FormFieldComponent],
  templateUrl: './extension-edit.component.html',
  styleUrl: './extension-edit.component.scss',
})
export class ExtensionEditComponent {
  readonly model = input.required<Extension>();
  readonly save   = output<Extension>();
  readonly cancel = output<void>();

  onSave(): void   { this.save.emit(this.model()); }
  onCancel(): void { this.cancel.emit(); }
}
