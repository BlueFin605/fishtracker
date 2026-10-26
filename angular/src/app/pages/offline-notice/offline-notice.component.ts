import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, filter, pairwise, take } from 'rxjs';
import { ConnectivityService } from '../../services/connectivity.service';

const MESSAGES: Record<string, string> = {
  'setup': 'Connect to the internet once to finish setting up your account.',
  'needs-connection': 'This page needs an internet connection.',
};

@Component({
  standalone: true,
  selector: 'app-offline-notice',
  imports: [RouterLink],
  template: `
    <div class="offline-notice">
      <p>{{ message }}</p>
      @if (isOffline) {
        @if (isSetup) {
          <p>We'll continue automatically when you're back online.</p>
        }
      } @else {
        <a routerLink="/trips" class="retry">Try again</a>
      }
      <a routerLink="/trips">Back</a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`.offline-notice { padding: 2rem; text-align: center; }`]
})
export class OfflineNoticeComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private connectivity = inject(ConnectivityService);
  private sub?: Subscription;
  private reason = this.route.snapshot.queryParamMap.get('reason') ?? '';
  isSetup = this.reason === 'setup';
  isOffline = !this.connectivity.isOnline();
  message = MESSAGES[this.reason] ?? MESSAGES['needs-connection'];

  ngOnInit(): void {
    if (!this.isSetup) return;
    // online$ replays its current value; only react to a real offline -> online
    // transition, otherwise an already-online user would loop through the guard.
    this.sub = this.connectivity.online$
      .pipe(pairwise(), filter(([prev, cur]) => !prev && cur), take(1))
      .subscribe(() => this.router.navigate(['/trips']));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
