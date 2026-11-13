import { AnalyticsSummary, ReportingPeriod } from '../models/analytics.model';
export function buildAnalyticsCsv(summary: AnalyticsSummary, period: ReportingPeriod): string {
  return [
    'Metric,Value',
    `Revenue,${summary.revenue}`,
    `Customers,${summary.customers}`,
    `Conversion,${summary.conversion}`,
    `Period (days),${period}`,
  ].join('\n');
}
export function downloadCsv(content: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
