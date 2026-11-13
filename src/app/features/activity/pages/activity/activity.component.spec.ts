import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivityComponent } from './activity.component';
describe('ActivityComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ActivityComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('renders returned audit events', () => {
    const fixture = TestBed.createComponent(ActivityComponent);
    TestBed.inject(HttpTestingController)
      .expectOne('/api/audit')
      .flush([
        {
          id: '1',
          action: 'Added member: Sarah',
          actor: 'admin@coredesk.demo',
          date: '2026-11-13T10:00:00Z',
        },
      ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Added member: Sarah');
    expect(fixture.componentInstance.loading()).toBe(false);
  });
  it('shows an API error and supports retry', () => {
    const fixture = TestBed.createComponent(ActivityComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/audit').flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.componentInstance.load();
    http.expectOne('/api/audit').flush([]);
    expect(fixture.componentInstance.error()).toBe('');
  });
});
