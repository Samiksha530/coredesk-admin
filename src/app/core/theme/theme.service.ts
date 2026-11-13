import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'coredesk-theme';
  readonly dark = signal(false);
  initialize(): void {
    let value = false;
    try {
      value = localStorage.getItem(this.storageKey) === 'dark';
    } catch {}
    this.apply(value);
  }
  toggle(): void {
    const value = !this.dark();
    this.apply(value);
    try {
      localStorage.setItem(this.storageKey, value ? 'dark' : 'light');
    } catch {}
  }
  private apply(value: boolean): void {
    this.dark.set(value);
    document.documentElement.classList.toggle('dark', value);
  }
}
