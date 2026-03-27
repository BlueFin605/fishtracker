import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SetupGuard implements CanActivate {
  private setupComplete: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  canActivate(): Observable<boolean> | boolean {
    if (this.setupComplete) {
      return true;
    }

    return this.apiService.getProfile().pipe(
      map(profile => {
        if (!profile.species || profile.species.length === 0) {
          this.router.navigate(['/setup']);
          return false;
        }
        this.setupComplete = true;
        return true;
      })
    );
  }
}
