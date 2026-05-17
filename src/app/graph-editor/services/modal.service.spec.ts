import { ModalService } from './modal.service';
import { Component, Type } from '@angular/core';

@Component({ selector: 'dummy', template: '', standalone: true })
class DummyComponent {}

describe('ModalService', () => {
  let svc: ModalService;
  beforeEach(() => { svc = new ModalService(); });

  it('starts with no active modal', () => {
    expect(svc.active()).toBeNull();
  });

  it('sets active on open', () => {
    void svc.open<string, string>(DummyComponent as Type<unknown>, 'input');
    const active = svc.active();
    expect(active).not.toBeNull();
    expect(active!.component).toBe(DummyComponent);
    expect(active!.input).toBe('input');
  });

  it('resolves promise with result on close', async () => {
    const promise = svc.open<string, number>(DummyComponent as Type<unknown>, 'x');
    svc.close(42);
    await expect(promise).resolves.toBe(42);
    expect(svc.active()).toBeNull();
  });

  it('resolves promise with null when close(null)', async () => {
    const promise = svc.open<string, number>(DummyComponent as Type<unknown>, 'x');
    svc.close(null);
    await expect(promise).resolves.toBeNull();
  });

  it('close() with no active modal is a no-op', () => {
    expect(() => svc.close('whatever')).not.toThrow();
  });
});
