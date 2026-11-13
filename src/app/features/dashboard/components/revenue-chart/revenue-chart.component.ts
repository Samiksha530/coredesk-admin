import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
@Component({
  selector: 'app-revenue-chart',
  templateUrl: './revenue-chart.component.html',
  styleUrl: './revenue-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueChartComponent {
  readonly series = input.required<readonly number[]>();
  readonly labels = input.required<readonly string[]>();
  readonly line = computed(() =>
    this.series()
      .map(
        (value, index) =>
          `${index === 0 ? 'M' : 'L'}${(index * 700) / Math.max(1, this.series().length - 1)} ${200 - value * 3}`,
      )
      .join(' '),
  );
  readonly area = computed(() => (this.line() ? `${this.line()} L700 200 L0 200 Z` : ''));
}
