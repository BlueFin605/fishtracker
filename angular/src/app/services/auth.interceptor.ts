import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private oauthEndpoints = [
    `${environment.domain}/oauth2/authorize?client_id=${environment.clientId}&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+profile&redirect_uri=${encodeURIComponent(environment.redirectUri)}`,
    `${environment.domain}/oauth2/token`
  ];

  constructor(private authService: AuthenticationService) {
    console.log('AuthInterceptor instantiated');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.access_token;
    // console.log(`interceptor token:[${token}]`);

    const isOAuthEndpoint = this.oauthEndpoints.some(endpoint => req.url.includes(endpoint));

    if (token && !req.headers.has('Authorization') && !isOAuthEndpoint) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || (error.status === 0 && error.error instanceof ProgressEvent)) {
            // Token might be expired, try to refresh it
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
      return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || (error.status === 0 && error.error instanceof ProgressEvent)) {
            // Token might be expired, try to refresh it
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
    }
  }
}