import { TestBed } from '@angular/core/testing';
import { RolesComponent } from './roles.component';
describe('RolesComponent', () => {
  it('shows all system roles and their read-only permission matrix', () => {
    TestBed.configureTestingModule({ imports: [RolesComponent] });
    const fixture = TestBed.createComponent(RolesComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    for (const role of ['Admin', 'Manager', 'Viewer']) expect(text).toContain(role);
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(text).toContain('read-only');
  });
});
