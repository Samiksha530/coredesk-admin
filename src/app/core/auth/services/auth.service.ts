import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, of, shareReplay, timeout, tap } from 'rxjs';
import { API_BASE_URL } from '../../http/api.config';
import { AuthSession, LoginCredentials } from '../models/auth.model';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly sessionState = signal<AuthSession | null>(null);
  private refreshRequest?: Observable<AuthSession>;
  readonly session = this.sessionState.asReadonly();
  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(tap((session) => this.sessionState.set(session)));
  }
  restoreSession(): Observable<AuthSession | null> {
    // Access tokens live in memory; reloads restore the session using an HttpOnly refresh cookie.
    sessionStorage.removeItem('coredesk-session');
    return this.refreshSession().pipe(
      timeout({ first: 5000 }),
      catchError(() => of(null)),
    );
  }
  refreshSession(): Observable<AuthSession> {
    // Concurrent 401 responses share one refresh request because refresh tokens are single-use.
    this.refreshRequest ??= this.http.post<AuthSession>(`${this.baseUrl}/auth/refresh`, {}).pipe(
      tap((session) => this.sessionState.set(session)),
      finalize(() => (this.refreshRequest = undefined)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshRequest;
  }
  logout(): void {
    this.http
      .post(`${this.baseUrl}/auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.clearSession();
  }
  clearSession(): void {
    this.sessionState.set(null);
    void this.router.navigate(['/login']);
  }
}
