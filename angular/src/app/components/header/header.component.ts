import { Component, Inject } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';
import { SyncService } from '../../services/offline/sync.service';
import { SyncState } from '../../services/offline/offline.types';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  currentRoute: string = '';
  syncState$: Observable<SyncState>;
  pendingCount$: Observable<number>;

  constructor(private router: Router, public authService: AuthenticationService, private syncService: SyncService) {
    this.syncState$ = this.syncService.syncState$;
    this.pendingCount$ = this.syncService.pendingCount$;

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects || event.url;
    });
  }

  get showStartTrip(): boolean {
    return !this.currentRoute.startsWith('/setup')
        && !this.currentRoute.startsWith('/newtrip')
        && !this.currentRoute.startsWith('/trip/');
  }

  ngOnInit() {
    // if (this.authService.isAuthenticated()) {
    //   this.authService.getUserAttributes().then(attributes => {
    //     this.userProfile = attributes;
    //   }).catch(error => {
    //     console.error('Error fetching user attributes', error);
    //   });
    // }  
  }


  onPreferences() {
    // Navigate to preferences page or open preferences dialog
    this.router.navigate(['/profile']);    
    // this.router.navigate(['/preferences']);
  }

  onSettings() {
    this.router.navigate(['/settings']);
  }

  onDebug() {
    // Navigate to preferences page or open preferences dialog
    this.router.navigate(['/debug']);    
    // this.router.navigate(['/preferences']);
  }
  onLogout() {
    // Handle logout logic
    this.authService.signOut();
    console.log('Logout clicked');
  }

}
