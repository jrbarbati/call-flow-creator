import {
  Component, ChangeDetectionStrategy, inject, computed, HostListener,
  ViewChild, AfterViewChecked, EventEmitter,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ModalService } from '../../services/modal.service';

interface EditComponentInstance {
  save?: EventEmitter<unknown>;
  cancel?: EventEmitter<void>;
}

@Component({
  selector: 'app-modal-outlet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  templateUrl: './modal-outlet.component.html',
  styleUrl: './modal-outlet.component.scss',
})
export class ModalOutletComponent implements AfterViewChecked {
  protected readonly modal = inject(ModalService);
  protected readonly active = this.modal.active;

  protected readonly inputs = computed(() => {
    const a = this.active();
    return a ? { model: a.input } : undefined;
  });

  @ViewChild(NgComponentOutlet) private outlet?: NgComponentOutlet;
  private wiredInstance: EditComponentInstance | null = null;

  ngAfterViewChecked(): void {
    const instance = (this.outlet as unknown as { componentInstance?: EditComponentInstance } | undefined)?.componentInstance ?? null;
    if (!instance || instance === this.wiredInstance) return;
    this.wiredInstance = instance;
    instance.save?.subscribe((result: unknown) => this.modal.close(result));
    instance.cancel?.subscribe(() => this.modal.close(null));
  }

  protected onBackdropClick(): void {
    this.modal.close(null);
    this.wiredInstance = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.active()) {
      this.modal.close(null);
      this.wiredInstance = null;
    }
  }
}
