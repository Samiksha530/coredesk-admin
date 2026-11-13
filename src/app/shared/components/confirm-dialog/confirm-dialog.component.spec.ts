import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';
describe('ConfirmDialogComponent', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: vi.fn(),
    });
    TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] });
  });
  function create() {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('title', 'Remove member?');
    fixture.componentRef.setInput('message', 'This removes the member.');
    fixture.detectChanges();
    return fixture;
  }
  it('opens a native modal and emits explicit confirmation', () => {
    const fixture = create();
    const confirm = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirm);
    fixture.nativeElement.querySelector('.danger').click();
    expect(confirm).toHaveBeenCalledOnce();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });
  it('disables actions and blocks Escape while saving', () => {
    const fixture = create();
    const cancel = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancel);
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.danger').disabled).toBe(true);
    fixture.componentInstance.onCancel(new Event('cancel'));
    expect(cancel).not.toHaveBeenCalled();
  });
});
