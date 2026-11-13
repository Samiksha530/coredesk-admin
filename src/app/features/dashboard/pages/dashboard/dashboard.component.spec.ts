import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
const summary = {
  revenue: 48295,
  customers: 2847,
  conversion: 3.62,
  growth: 12.8,
  series: [12, 18, 30, 45],
};
describe('DashboardComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  function create() {
    const fixture = TestBed.createComponent(DashboardComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/analytics?period=30').flush(summary);
    http.expectOne('/api/users').flush([]);
    fixture.detectChanges();
    return fixture;
  }
  it('renders API revenue and generates a chart path', () => {
    const fixture = create();
    expect(fixture.nativeElement.textContent).toContain('$48,295');
    expect(
      fixture.nativeElement.querySelector('app-revenue-chart path[stroke]').getAttribute('d'),
    ).toContain('M0 164');
  });
  it('cancels an old period request before loading the next', () => {
    const component = create().componentInstance;
    component.load('90');
    const previous = TestBed.inject(HttpTestingController).expectOne('/api/analytics?period=90');
    component.load('365');
    expect(previous.cancelled).toBe(true);
    TestBed.inject(HttpTestingController)
      .expectOne('/api/analytics?period=365')
      .flush({ ...summary, revenue: 579540 });
    expect(component.data()?.revenue).toBe(579540);
  });
  it('can retry after a failed request', () => {
    const component = create().componentInstance;
    component.load('90');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/analytics?period=90')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.error()).toContain('Could not load');
    component.load('90');
    TestBed.inject(HttpTestingController).expectOne('/api/analytics?period=90').flush(summary);
    expect(component.error()).toBe('');
  });
});
