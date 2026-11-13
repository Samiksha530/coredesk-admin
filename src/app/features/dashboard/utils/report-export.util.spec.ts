import { buildAnalyticsCsv } from './report-export.util';
describe('buildAnalyticsCsv', () => {
  it('exports one metric per row for the selected period', () => {
    const csv = buildAnalyticsCsv(
      { revenue: 100, customers: 20, conversion: 4, growth: 2, series: [] },
      '90',
    );
    expect(csv.split('\n')).toEqual([
      'Metric,Value',
      'Revenue,100',
      'Customers,20',
      'Conversion,4',
      'Period (days),90',
    ]);
  });
});
