import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/http/api.config';
import { AuditEvent } from '../models/audit-event.model';
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  getEvents() {
    return this.http.get<AuditEvent[]>(`${this.baseUrl}/audit`);
  }
}
