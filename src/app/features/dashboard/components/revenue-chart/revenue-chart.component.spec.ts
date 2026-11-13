import { TestBed } from '@angular/core/testing';
import { RevenueChartComponent } from './revenue-chart.component';
describe('RevenueChartComponent', () => {
  it('updates the SVG path when data changes', () => {
    TestBed.configureTestingModule({ imports: [RevenueChartComponent] });
    const fixture = TestBed.createComponent(RevenueChartComponent);
    fixture.componentRef.setInput('series', [10, 30]);
    fixture.componentRef.setInput('labels', ['Start', 'End']);
    fixture.detectChanges();
    expect(fixture.componentInstance.line()).toBe('M0 170 L700 110');
    fixture.componentRef.setInput('series', []);
    fixture.detectChanges();
    expect(fixture.componentInstance.area()).toBe('');
  });
});
