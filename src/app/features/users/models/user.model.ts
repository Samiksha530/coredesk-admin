import { Role } from '../../../core/auth/models/auth.model';
export const USER_STATUSES = ['Active', 'Invited', 'Suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  department: string;
  joined: string;
}
export type SaveUserRequest = Omit<User, 'id' | 'joined'> & { id?: string };
