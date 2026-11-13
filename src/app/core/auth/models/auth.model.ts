export const ROLES = ['Admin', 'Manager', 'Viewer'] as const;
export type Role = (typeof ROLES)[number];
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface AuthSession {
  name: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: number;
}
