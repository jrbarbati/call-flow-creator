import { Component, ChangeDetectionStrategy, HostListener, input, output } from '@angular/core';

export type TriggerOptionGroup = 'destinations' | 'forwards' | 'fallbacks';

export interface TriggerOption {
  value: string;          // e.g. 'dest:OFFICE_CLOSED' | 'fwd:5' | 'timeout' | 'invalidkey'
  label: string;
  color: string;
  group: TriggerOptionGroup;
  inUse?: boolean;
}

@Component({
  selector: 'app-trigger-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trigger-picker.component.html',
  styleUrl: './trigger-picker.component.scss',
})
export class TriggerPickerComponent {
  readonly options = input.required<TriggerOption[]>();
  readonly position = input.required<{ x: number; y: number }>();
  readonly pick = output<string>();
  readonly cancel = output<void>();

  protected readonly groupOrder: TriggerOptionGroup[] = ['destinations', 'forwards', 'fallbacks'];
  protected readonly groupLabels: Record<TriggerOptionGroup, string> = {
    destinations: 'Destinations',
    forwards: 'Key Options',
    fallbacks: 'Fallbacks',
  };

  protected optionsFor(group: TriggerOptionGroup) {
    return this.options().filter(o => o.group === group);
  }

  protected onPick(opt: TriggerOption): void {
    this.pick.emit(opt.value);
  }

  protected onBackdrop(event: MouseEvent): void {
    event.stopPropagation();
    this.cancel.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel.emit();
  }
}
