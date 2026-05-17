import { Injectable, Type, signal } from '@angular/core';

interface ActiveModal {
  component: Type<unknown>;
  input: unknown;
  resolve: (result: unknown) => void;
}

@Injectable()
export class ModalService {
  readonly active = signal<ActiveModal | null>(null);

  open<TInput, TResult>(component: Type<unknown>, input: TInput): Promise<TResult | null> {
    return new Promise<TResult | null>(resolve => {
      this.active.set({
        component,
        input: input as unknown,
        resolve: r => resolve(r as TResult | null),
      });
    });
  }

  close<TResult>(result: TResult | null): void {
    const a = this.active();
    if (!a) return;
    a.resolve(result);
    this.active.set(null);
  }
}
