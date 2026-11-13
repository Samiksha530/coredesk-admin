import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthSession, Role } from '../app/core/auth/models/auth.model';
import { AuthService } from '../app/core/auth/services/auth.service';
export function createSession(role: Role = 'Admin'): AuthSession {
  return {
    name: 'Alex Morgan',
    email: `${role.toLowerCase()}@coredesk.demo`,
    role,
    token: 'test-access-token',
    expiresAt: Date.now() + 900000,
  };
}
export function provideTestAuth(role: Role = 'Admin') {
  return {
    provide: AuthService,
    useValue: { session: signal<AuthSession | null>(createSession(role)), logout: vi.fn() },
  };
}
