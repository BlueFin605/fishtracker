// src/app/services/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthenticationService) {
    console.log('AuthInterceptor instantiated');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.access_token;
    console.log(`interceptor token:[${token}]`);
    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || (error.status === 0 && error.error instanceof ProgressEvent)) {            // Token might be expired, try to refresh it
            return this.authService.refreshToken().pipe(
              switchMap(() => {
                const newToken = this.authService.access_token;
                const newCloned = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                });
                return next.handle(newCloned);
              }),
              catchError(refreshError => {
                // Handle refresh token failure
                return throwError(refreshError);
              })
            );
          } else {
            return throwError(error);
          }
        })
      );
    } else {
      return next.handle(req);
    }
  }
}