import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/http/api.config';
import { AnalyticsSummary, ReportingPeriod } from '../models/analytics.model';
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  getSummary(period: ReportingPeriod) {
    return this.http.get<AnalyticsSummary>(`${this.baseUrl}/analytics`, { params: { period } });
  }
}
