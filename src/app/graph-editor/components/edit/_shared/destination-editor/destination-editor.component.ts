import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DestinationTrigger } from '../../../../models/ringGroup';
import { AnyDestination, triggerColorFor, triggerLabelFor } from '../../../../models/destination';
import { NodeType } from '../../../../models/node-types';
import { FormFieldComponent } from '../form-field.component';
import { SelectFieldComponent, SelectOption } from '../select-field.component';
import { EXTENSIONS } from '../../../../models/node-types';

const KIND_OPTIONS: SelectOption[] = [
  { value: 'Extension',                label: 'Extension' },
  { value: 'VoiceMail',                label: 'Voicemail of Extension' },
  { value: 'VoiceApp',                 label: 'Call Processing Script' },
  { value: 'External',                 label: 'External Number' },
  { value: 'ProceedWithNoExceptions',  label: 'Accept Anyway' },
  { value: 'None',                     label: 'End Call' },
];

@Component({
  selector: 'app-destination-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, FormFieldComponent, SelectFieldComponent],
  templateUrl: './destination-editor.component.html',
  styleUrl: './destination-editor.component.scss',
})
export class DestinationEditorComponent {
  readonly trigger = input.required<DestinationTrigger>();
  readonly sourceType = input.required<NodeType>();
  readonly value = input.required<AnyDestination>();
  readonly valueChange = output<AnyDestination>();

  protected readonly kindOptions = KIND_OPTIONS;

  protected readonly extensionOptions = computed<SelectOption[]>(() => {
    return EXTENSIONS.map(e => ({ value: e.number, label: `${e.number} - ${e.firstName} ${e.lastName}` }));
  });

  protected readonly triggerLabel = computed(() => triggerLabelFor(this.sourceType(), this.trigger()));
  protected readonly triggerColor = computed(() => triggerColorFor(this.trigger()));
  protected readonly currentKind = computed(() => this.value().toValue ?? 'None');

  protected onKindChange(kind: string): void {
    const v: AnyDestination = {
      ...this.value(),
      toValue: kind,
      name: null,
      targetType: null,
      extensionNumber: null,
      external: null,
    } as AnyDestination;
    this.valueChange.emit(v);
  }

  protected onExtensionChange(num: string): void {
    this.emit({ extensionNumber: num, name: this.value().name });
  }

  protected onExternalChange(num: string): void {
    this.emit({ external: num });
  }

  protected onCallProcessingScriptNameChange(name: string): void {
    this.emit({ name });
  }

  protected onPromptChange(prompt: string): void {
    this.emit({ prompt });
  }

  protected onPromptEnabledChange(enabled: boolean): void {
    this.emit({ promptEnabled: enabled });
  }

  private emit(patch: Partial<AnyDestination>): void {
    this.valueChange.emit({ ...this.value(), ...patch } as AnyDestination);
  }
}
