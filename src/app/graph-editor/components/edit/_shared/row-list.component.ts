import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-row-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './row-list.component.html',
  styleUrl: './row-list.component.scss',
})
export class RowListComponent {
  readonly addLabel = input<string>('Add row');
  readonly add = output<void>();
}
