import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShareService } from '../../services/share.service';
import { ShareSummary } from '../../services/share.types';

@Component({
  selector: 'app-my-shares',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-shares.component.html',
  styleUrls: ['./my-shares.component.css'],
})
export class MySharesPageComponent implements OnInit {
  tab: 'sent' | 'received' = 'sent';
  sent: ShareSummary[] = [];
  received: ShareSummary[] = [];
  loading = false;

  constructor(private svc: ShareService) {}

  ngOnInit() {
    this.reload();
  }

  switchTo(tab: 'sent' | 'received') {
    this.tab = tab;
    this.reload();
  }

  reload() {
    this.loading = true;
    const direction = this.tab === 'sent' ? 'outbox' : 'inbox';
    this.svc.list(direction).subscribe({
      next: (rows) => {
        this.loading = false;
        if (this.tab === 'sent') this.sent = rows;
        else this.received = rows;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  copyLink(s: ShareSummary) {
    const base = location.origin + '/shared/';
    navigator.clipboard?.writeText(base + s.shareId);
  }

  revoke(s: ShareSummary) {
    if (!confirm(`Revoke share to ${s.recipientEmail}?`)) return;
    this.svc.revoke(s.shareId).subscribe(() => this.reload());
  }

  statusLabel(s: ShareSummary): string {
    if (s.revokedAt) return 'Revoked';
    if (s.expiresAt && new Date(s.expiresAt) < new Date()) return 'Expired';
    return 'Active';
  }
}
