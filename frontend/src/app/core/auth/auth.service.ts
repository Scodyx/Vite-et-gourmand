import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Role = 'USER' | 'EMPLOYEE' | 'ADMIN';
export interface AuthResponse { accessToken: string; tokenType: string; expiresIn: number; role: Role; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'veg_access_token';
  private readonly roleKey = 'veg_role';
  readonly role = signal<Role | null>(sessionStorage.getItem(this.roleKey) as Role | null);
  constructor(private http: HttpClient, private router: Router) {}
  login(value: {email: string; password: string}) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, value).pipe(tap(r => this.store(r)));
  }
  register(value: object) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, value).pipe(tap(r => this.store(r)));
  }
  token() { return sessionStorage.getItem(this.tokenKey); }
  isAuthenticated() { return !!this.token(); }
  hasRole(roles: Role[]) { const role = this.role(); return role !== null && roles.includes(role); }
  logout() { sessionStorage.clear(); this.role.set(null); this.router.navigateByUrl('/'); }
  private store(response: AuthResponse) {
    sessionStorage.setItem(this.tokenKey, response.accessToken);
    sessionStorage.setItem(this.roleKey, response.role);
    this.role.set(response.role);
  }
}
