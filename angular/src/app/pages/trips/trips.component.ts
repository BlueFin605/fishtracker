import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripDetails } from '../../services/api.service';
import { Router } from '@angular/router';
import { FishTrackerSettingsService } from '../../services/fish-tracker-settings.service';
import { OfflineDataService } from '../../services/offline/offline-data.service';
import { DateFormatModule } from '../../components/date-format/date-format.module';
import { SyncStatus } from '../../services/offline/offline.types';
import { ShareDialogComponent, ShareDialogTripOption } from '../share-dialog/share-dialog.component';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, DateFormatModule, ShareDialogComponent],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.css'
})
export class TripsComponent {
  trips: (TripDetails & { syncStatus?: SyncStatus })[];
  relevantTrips: boolean;

  selectedTripIds = new Set<string>();
  shareDialogOpen = false;
  availableTripsForDialog: ShareDialogTripOption[] = [];

  constructor(private router: Router,
    private offlineData: OfflineDataService,
    private fishTrackerSettingsService: FishTrackerSettingsService,
    private cdr: ChangeDetectorRef,
  ) {
    this.trips = [];
    this.relevantTrips = this.fishTrackerSettingsService.relevantTrips;
  }

  ngOnInit() {
    console.log('TripsComponent ngOnInit');
    this.getAllTrips();
  }

  getAllTrips(): void {
    this.offlineData.getTrips().subscribe({
      next: (data) => {
        this.trips = data as (TripDetails & { syncStatus?: SyncStatus })[];
        this.cdr.detectChanges();
        console.log(`trips data ${JSON.stringify(this.trips)}`);
      },
      error: (error) => {
        console.error('Error fetching trips:', error);
      }
    });
  }

  confirmDeleteTrip(tripId: string, event: Event): void {
    event.stopPropagation();
    const confirmed = confirm('Are you sure you want to delete this trip?');
    if (confirmed) {
      this.deleteTrip(tripId);
    }
  }

  deleteTrip(tripId: string): void {
    this.offlineData.deleteTrip(tripId).subscribe({
      next: () => {
        console.log(`Trip ${tripId} deleted`);
        this.getAllTrips();
      },
      error: (error) => {
        console.error('Error deleting trip:', error);
      }
    });
  }

  toggleTrips(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.relevantTrips = checkbox.checked;
    this.fishTrackerSettingsService.relevantTrips = this.relevantTrips;
    this.getAllTrips();
  }

  navigateToTripCatch(tripId: string) {
    this.router.navigate(['/trip', tripId]);
  }

  isPending(trip: TripDetails & { syncStatus?: SyncStatus }): boolean {
    return trip.syncStatus === 'pending' || trip.syncStatus === 'modified';
  }

  toggleTripSelection(tripId: string, event: Event): void {
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedTripIds.add(tripId);
    } else {
      this.selectedTripIds.delete(tripId);
    }
  }

  isTripSelected(tripId: string): boolean {
    return this.selectedTripIds.has(tripId);
  }

  get selectedTripIdsArr(): string[] {
    return Array.from(this.selectedTripIds);
  }

  openShareDialog(): void {
    if (this.selectedTripIds.size === 0) return;
    this.availableTripsForDialog = this.trips
      .filter((t) => this.selectedTripIds.has(t.tripId))
      .map((t) => ({
        tripId: t.tripId,
        startTime: t.startTime as unknown as string,
        catchCount: t.catchSize ?? 0,
      }));
    this.shareDialogOpen = true;
  }

  onShareDialogClosed(ev: { shareId?: string }): void {
    this.shareDialogOpen = false;
    if (ev.shareId) {
      alert('Share sent. View in My Shares.');
    }
  }
}
