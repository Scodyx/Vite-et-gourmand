import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Role = 'USER' | 'EMPLOYEE' | 'ADMIN';
export interface AuthResponse { accessToken: string; refreshToken: string; tokenType: string; expiresIn: number; role: Role; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'veg_access_token';
  private readonly roleKey = 'veg_role';
  private readonly refreshKey = 'veg_refresh_token';
  private refreshRequest?: Observable<AuthResponse>;
  readonly role = signal<Role | null>(sessionStorage.getItem(this.roleKey) as Role | null);
  constructor(private http: HttpClient, private router: Router) {}
  login(value: {email: string; password: string}) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, value).pipe(tap(r => this.store(r)));
  }
  register(value: object) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, value).pipe(tap(r => this.store(r)));
  }
  token() { return sessionStorage.getItem(this.tokenKey); }
  refreshToken() { return sessionStorage.getItem(this.refreshKey); }
  refresh() {
    if (this.refreshRequest) return this.refreshRequest;
    const refreshToken = this.refreshToken();
    if (!refreshToken) throw new Error('Aucun refresh token');
    this.refreshRequest = this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {refreshToken}).pipe(
      tap(r => this.store(r)), finalize(() => this.refreshRequest = undefined), shareReplay(1));
    return this.refreshRequest;
  }
  isAuthenticated() { return !!this.token(); }
  hasRole(roles: Role[]) { const role = this.role(); return role !== null && roles.includes(role); }
  logout() {
    const refreshToken=this.refreshToken();
    if(refreshToken)this.http.post(`${environment.apiUrl}/auth/logout`,{refreshToken}).subscribe({error:()=>{}});
    this.clear();this.router.navigateByUrl('/');
  }
  clear(){sessionStorage.removeItem(this.tokenKey);sessionStorage.removeItem(this.refreshKey);sessionStorage.removeItem(this.roleKey);this.role.set(null);}
  private store(response: AuthResponse) {
    sessionStorage.setItem(this.tokenKey, response.accessToken);
    sessionStorage.setItem(this.refreshKey, response.refreshToken);
    sessionStorage.setItem(this.roleKey, response.role);
    this.role.set(response.role);
  }
}
