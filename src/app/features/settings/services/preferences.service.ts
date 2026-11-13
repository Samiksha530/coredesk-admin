import { Injectable } from '@angular/core';
import { DEFAULT_PREFERENCES, WorkspacePreferences } from '../models/preferences.model';
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly storageKey = 'coredesk-preferences';
  load(): WorkspacePreferences {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(this.storageKey) ?? 'null');
      if (
        value &&
        typeof value === 'object' &&
        'displayName' in value &&
        typeof value.displayName === 'string' &&
        'digest' in value &&
        (value.digest === 'enabled' || value.digest === 'disabled') &&
        'currency' in value &&
        (value.currency === 'USD' || value.currency === 'EUR' || value.currency === 'INR')
      )
        return value as WorkspacePreferences;
    } catch {}
    return { ...DEFAULT_PREFERENCES };
  }
  save(preferences: WorkspacePreferences): void {
    localStorage.setItem(this.storageKey, JSON.stringify(preferences));
  }
}
