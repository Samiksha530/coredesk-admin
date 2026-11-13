export interface WorkspacePreferences {
  displayName: string;
  digest: 'enabled' | 'disabled';
  currency: 'USD' | 'EUR' | 'INR';
}
export const DEFAULT_PREFERENCES: WorkspacePreferences = {
  displayName: 'Alex Morgan',
  digest: 'enabled',
  currency: 'USD',
};
