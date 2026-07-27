import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const authenticated = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  return next(authenticated).pipe(catchError(error => {
    const isAuthCall=request.url.includes('/auth/');
    if(error.status!==401||isAuthCall||!auth.refreshToken())return throwError(()=>error);
    return auth.refresh().pipe(switchMap(response=>next(request.clone({setHeaders:{Authorization:`Bearer ${response.accessToken}`}}))),
      catchError(refreshError=>{auth.clear();return throwError(()=>refreshError);}));
  }));
};
