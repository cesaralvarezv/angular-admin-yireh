import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/auth';
  
  currentUser = signal<{ email: string; roles: string[]; token: string } | null>(null);

  constructor(private http: HttpClient) {
    this.loadSession();
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_email', res.email);
          localStorage.setItem('auth_roles', JSON.stringify(res.roles || []));
          this.currentUser.set({
            email: res.email,
            roles: res.roles || [],
            token: res.token
          });
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('auth_roles');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.roles.includes(role) || user.roles.includes(`ROLE_${role}`);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isCashier(): boolean {
    return this.hasRole('CASHIER') || this.isAdmin();
  }

  private loadSession(): void {
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('auth_email');
    const rolesStr = localStorage.getItem('auth_roles');
    if (token && email) {
      try {
        const roles = rolesStr ? JSON.parse(rolesStr) : [];
        this.currentUser.set({ email, roles, token });
      } catch {
        this.currentUser.set(null);
      }
    }
  }
}
