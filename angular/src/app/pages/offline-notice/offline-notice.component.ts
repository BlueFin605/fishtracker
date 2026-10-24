import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
      <a routerLink="/trips">Back</a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`.offline-notice { padding: 2rem; text-align: center; }`]
})
export class OfflineNoticeComponent {
  private route = inject(ActivatedRoute);
  message = MESSAGES[this.route.snapshot.queryParamMap.get('reason') ?? ''] ?? MESSAGES['needs-connection'];
}
