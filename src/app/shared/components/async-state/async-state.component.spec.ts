import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AsyncStateComponent } from './async-state.component';
describe('AsyncStateComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AsyncStateComponent] }));
  it('announces API errors and emits retry', () => {
    const fixture = TestBed.createComponent(AsyncStateComponent);
    fixture.componentRef.setInput('state', 'error');
    fixture.componentRef.setInput('message', 'API unavailable');
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'API unavailable',
    );
    fixture.nativeElement.querySelector('button').click();
    expect(retry).toHaveBeenCalledOnce();
  });
  it('announces loading without offering a retry action', () => {
    const fixture = TestBed.createComponent(AsyncStateComponent);
    fixture.componentRef.setInput('state', 'loading');
    fixture.componentRef.setInput('message', 'Loading members');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
