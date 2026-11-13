import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
describe('StatusBadgeComponent', () => {
  it('shows suspended status with the appropriate visual state', () => {
    TestBed.configureTestingModule({ imports: [StatusBadgeComponent] });
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', 'Suspended');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.suspended').textContent).toContain('Suspended');
  });
});
