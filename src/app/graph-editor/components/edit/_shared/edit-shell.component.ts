import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-edit-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-shell.component.html',
  styleUrl: './edit-shell.component.scss',
})
export class EditShellComponent {
  readonly title = input.required<string>();
  readonly save   = output<void>();
  readonly cancel = output<void>();
}
