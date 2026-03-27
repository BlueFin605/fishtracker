import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthenticationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (environment.bypassAuth) {
      return next.handle(req);
    }

    // Don't intercept OAuth token requests — they must not carry a Bearer header
    // and their errors should not trigger a refresh loop
    if (req.url.includes('/oauth2/token') || req.url.includes('/oauth2/authorize')) {
      return next.handle(req);
    }

    const token = this.authService.access_token;

    const authReq = token
      ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || (error.status === 0 && error.error instanceof ProgressEvent)) {
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              const newToken = this.authService.access_token;
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${newToken}`)
              });
              return next.handle(retryReq);
            })
          );
        }
        return throwError(error);
      })
    );
  }
}
