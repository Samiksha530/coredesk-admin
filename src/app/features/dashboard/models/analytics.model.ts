export type ReportingPeriod = '30' | '90' | '365';
export interface AnalyticsSummary {
  revenue: number;
  customers: number;
  conversion: number;
  growth: number;
  series: number[];
}
export interface CustomerSegment {
  name: string;
  value: number;
  color: string;
}
