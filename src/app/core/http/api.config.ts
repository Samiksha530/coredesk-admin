import { InjectionToken } from '@angular/core';
// Relative requests stay on the current origin; the development proxy targets the local API.
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
