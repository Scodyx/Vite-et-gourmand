import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      provideRouter([])
    ]});
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });
  afterEach(() => { controller.verify(); sessionStorage.clear(); });

  it('adds the bearer token', () => {
    sessionStorage.setItem('veg_access_token', 'access');
    http.get('/protected').subscribe();
    expect(controller.expectOne('/protected').request.headers.get('Authorization')).toBe('Bearer access');
  });

  it('refreshes once after a 401 and retries with the rotated token', () => {
    sessionStorage.setItem('veg_access_token', 'old-access');
    sessionStorage.setItem('veg_refresh_token', 'old-refresh');
    http.get('/protected').subscribe();
    controller.expectOne('/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne(request => request.url.endsWith('/auth/refresh')).flush({
      accessToken: 'new-access', refreshToken: 'new-refresh', tokenType: 'Bearer', expiresIn: 900, role: 'USER'
    });
    expect(controller.expectOne('/protected').request.headers.get('Authorization')).toBe('Bearer new-access');
    expect(auth.refreshToken()).toBe('new-refresh');
  });

  it('does not try to refresh an authentication endpoint', () => {
    sessionStorage.setItem('veg_access_token', 'old-access');
    sessionStorage.setItem('veg_refresh_token', 'old-refresh');
    let status: number | undefined;
    http.post('/auth/login', {}).subscribe({ error: error => status = error.status });
    controller.expectOne('/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    controller.expectNone(request => request.url.includes('/auth/refresh'));
  });
});
