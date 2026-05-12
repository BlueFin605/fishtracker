import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShareService } from '../../services/share.service';
import { SizeLegendComponent } from '../../components/size-legend/size-legend.component';

export interface ShareDialogTripOption {
  tripId: string;
  startTime: string;
  catchCount: number;
}

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SizeLegendComponent],
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.css'],
})
export class ShareDialogComponent implements OnInit {
  @Input() availableTrips: ShareDialogTripOption[] = [];
  @Input() preselectedTripIds: string[] = [];
  @Output() closed = new EventEmitter<{ shareId?: string }>();

  selectedTripIds = new Set<string>();
  recipientEmail = '';
  fuzzLocation = true;
  expiresInDays: number | null = 30;
  message = '';
  submitting = false;
  error: string | null = null;

  constructor(private shareSvc: ShareService) {}

  ngOnInit() {
    for (const id of this.preselectedTripIds) this.selectedTripIds.add(id);
  }

  toggle(id: string) {
    if (this.selectedTripIds.has(id)) {
      this.selectedTripIds.delete(id);
    } else {
      this.selectedTripIds.add(id);
    }
  }

  selectAll() {
    for (const t of this.availableTrips) this.selectedTripIds.add(t.tripId);
  }

  clearAll() {
    this.selectedTripIds.clear();
  }

  get catchCount(): number {
    return this.availableTrips
      .filter((t) => this.selectedTripIds.has(t.tripId))
      .reduce((sum, t) => sum + t.catchCount, 0);
  }

  get canSubmit(): boolean {
    return (
      this.selectedTripIds.size > 0 &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.recipientEmail.trim()) &&
      !this.submitting
    );
  }

  send() {
    if (!this.canSubmit) return;
    this.submitting = true;
    this.error = null;
    this.shareSvc
      .create({
        tripIds: Array.from(this.selectedTripIds),
        recipientEmail: this.recipientEmail.trim(),
        fuzzLocation: this.fuzzLocation,
        expiresInDays: this.expiresInDays,
        message: this.message.trim() || null,
      })
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.closed.emit({ shareId: res.shareId });
        },
        error: (err) => {
          this.submitting = false;
          this.error = `Could not send share (HTTP ${err.status}).`;
        },
      });
  }

  cancel() {
    this.closed.emit({});
  }
}
