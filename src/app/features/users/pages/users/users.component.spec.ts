import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsersComponent } from './users.component';
import { User } from '../../models/user.model';
import { provideTestAuth } from '../../../../../testing/auth.fixture';
const members: User[] = Array.from({ length: 9 }, (_, index) => ({
  id: String(index),
  name: `Member ${index}`,
  email: `member${index}@coredesk.demo`,
  role: index === 0 ? 'Admin' : 'Viewer',
  status: index === 8 ? 'Invited' : 'Active',
  department: 'Engineering',
  joined: '2026-11-13',
}));
describe('UsersComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestAuth()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  function create() {
    const fixture = TestBed.createComponent(UsersComponent);
    TestBed.inject(HttpTestingController).expectOne('/api/users').flush(members);
    fixture.detectChanges();
    return fixture;
  }
  it('combines search and filters, resetting pagination', () => {
    const component = create().componentInstance;
    expect(component.paged()).toHaveLength(7);
    component.page.set(2);
    expect(component.paged()).toHaveLength(2);
    component.updateQuery(' MEMBER8@COREdesk.demo ');
    expect(component.page()).toBe(1);
    expect(component.filtered()).toHaveLength(1);
    component.updateStatus('Active');
    expect(component.filtered()).toHaveLength(0);
  });
  it('sorts members by name in both directions', () => {
    const component = create().componentInstance;
    expect(component.paged()[0].name).toBe('Member 0');
    component.asc.set(false);
    expect(component.paged()[0].name).toBe('Member 8');
  });
  it('rejects whitespace-only form values', () => {
    const component = create().componentInstance;
    component.openMemberForm();
    component.form.patchValue({
      name: '   ',
      email: 'new@coredesk.demo',
      department: 'Engineering',
    });
    component.save();
    expect(component.form.controls.name.hasError('whitespace')).toBe(true);
    TestBed.inject(HttpTestingController).expectNone((request) => request.method === 'POST');
  });
  it('keeps the form open when the API reports a duplicate email', () => {
    const component = create().componentInstance;
    component.openMemberForm();
    component.form.patchValue({
      name: 'New Member',
      email: 'new@coredesk.demo',
      department: 'Engineering',
    });
    component.save();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/users')
      .flush(
        { message: 'A member with this email already exists.' },
        { status: 409, statusText: 'Conflict' },
      );
    expect(component.showForm()).toBe(true);
    expect(component.saving()).toBe(false);
    expect(component.formError()).toContain('already exists');
  });
  it('creates a member and reloads the table', () => {
    const component = create().componentInstance;
    component.openMemberForm();
    component.form.patchValue({
      name: 'New Member',
      email: 'new@coredesk.demo',
      department: 'Engineering',
    });
    component.save();
    const save = TestBed.inject(HttpTestingController).expectOne('/api/users');
    expect(save.request.method).toBe('POST');
    save.flush({ ...members[1], id: 'new' });
    TestBed.inject(HttpTestingController)
      .expectOne('/api/users')
      .flush([...members, { ...members[1], id: 'new' }]);
    expect(component.users()).toHaveLength(10);
    expect(component.showForm()).toBe(false);
  });
  it('hides all member mutation actions for viewers', () => {
    TestBed.overrideProvider(provideTestAuth().provide, provideTestAuth('Viewer'));
    const fixture = create();
    expect(fixture.componentInstance.canEdit()).toBe(false);
    expect(
      [...fixture.nativeElement.querySelectorAll('button')].some((button: HTMLButtonElement) =>
        button.textContent?.includes('Add member'),
      ),
    ).toBe(false);
    fixture.componentInstance.remove(members[1]);
    TestBed.inject(HttpTestingController).expectNone((request) => request.method === 'DELETE');
  });
  it('prevents managers from editing admin members', () => {
    TestBed.overrideProvider(provideTestAuth().provide, provideTestAuth('Manager'));
    const component = create().componentInstance;
    expect(component.canEditMember(members[0])).toBe(false);
    component.openMemberForm(members[0]);
    expect(component.showForm()).toBe(false);
  });
});
