import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
describe('AuthService',()=>{
 let service:AuthService;let http:HttpTestingController;
 beforeEach(()=>{sessionStorage.clear();TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]});
  service=TestBed.inject(AuthService);http=TestBed.inject(HttpTestingController);});
 afterEach(()=>{http.verify();sessionStorage.clear();});
 it('stores access and refresh tokens after login',()=>{
  service.login({email:'client@example.test',password:'Secret123!'}).subscribe();
  http.expectOne(r=>r.url.endsWith('/auth/login')).flush({accessToken:'access',refreshToken:'refresh',tokenType:'Bearer',expiresIn:900,role:'USER'});
  expect(service.token()).toBe('access');expect(service.refreshToken()).toBe('refresh');expect(service.role()).toBe('USER');
 });
 it('rotates the refresh token',()=>{
  sessionStorage.setItem('veg_refresh_token','old');service.refresh().subscribe();
  const request=http.expectOne(r=>r.url.endsWith('/auth/refresh'));expect(request.request.body).toEqual({refreshToken:'old'});
  request.flush({accessToken:'new-access',refreshToken:'new-refresh',tokenType:'Bearer',expiresIn:900,role:'USER'});
  expect(service.token()).toBe('new-access');expect(service.refreshToken()).toBe('new-refresh');
 });
});
