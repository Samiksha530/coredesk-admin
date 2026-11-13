import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/http/api.config';
import { User, SaveUserRequest } from '../models/user.model';
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  getUsers() {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }
  saveUser(user: SaveUserRequest) {
    return user.id
      ? this.http.put<User>(`${this.baseUrl}/users/${encodeURIComponent(user.id)}`, user)
      : this.http.post<User>(`${this.baseUrl}/users`, user);
  }
  deleteUser(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/users/${encodeURIComponent(id)}`);
  }
}
