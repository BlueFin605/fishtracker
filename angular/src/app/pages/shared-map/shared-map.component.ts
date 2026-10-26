import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConnectivityService } from '../../services/connectivity.service';
import { ActivatedRoute } from '@angular/router';
import { ShareService } from '../../services/share.service';
import { GoogleMapsLoaderService } from '../../google-maps-loader.service';
import { AuthenticationService } from '../../services/authentication.service';
import { FISH_SIZE_COLORS, ShareDetails, FrozenCatchDto } from '../../services/share.types';
import { SizeLegendComponent } from '../../components/size-legend/size-legend.component';
import { ShareWatermarkComponent } from '../../components/share-watermark/share-watermark.component';

@Component({
  selector: 'app-shared-map',
  standalone: true,
  imports: [CommonModule, SizeLegendComponent, ShareWatermarkComponent],
  templateUrl: './shared-map.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./shared-map.component.css'],
})
export class SharedMapPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  share: ShareDetails | null = null;
  viewerEmail = '';
  state: 'loading' | 'ready' | 'gone' | 'error' = 'loading';
  errorMessage = '';
  mapsUnavailable = false;
  private mapsLoaded = false;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private shareSvc: ShareService,
    private maps: GoogleMapsLoaderService,
    private auth: AuthenticationService,
    private connectivity: ConnectivityService
  ) {}

  ngOnInit() {
    this.viewerEmail = this.auth.userEmail ?? '';
    const shareId = this.route.snapshot.paramMap.get('shareId')!;
    this.shareSvc.get(shareId).subscribe({
      next: (s) => {
        this.share = s;
        this.state = 'ready';
        this.drawMapIfReady();
      },
      error: (err) => {
        if (err.status === 410) {
          this.state = 'gone';
          return;
        }
        this.state = 'error';
        this.errorMessage = `Failed to load share (HTTP ${err.status}).`;
      },
    });
  }

  ngAfterViewInit() {
    this.sub = this.connectivity.online$.subscribe((online) => {
      if (online && this.mapsUnavailable) {
        this.mapsUnavailable = false;
        void this.loadMaps();
      }
    });
    void this.loadMaps();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private async loadMaps() {
    try {
      await this.maps.loadScript();
    } catch {
      this.mapsUnavailable = true;
      return;
    }
    this.mapsLoaded = true;
    this.drawMapIfReady();
  }

  private drawMapIfReady() {
    if (this.state !== 'ready' || !this.share || !this.mapsLoaded || !this.mapEl) return;

    const allCatches: FrozenCatchDto[] = this.share.trips.flatMap((t) => t.catches);
    if (allCatches.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    allCatches.forEach((c) =>
      bounds.extend({
        lat: c.displayLocation.latitude,
        lng: c.displayLocation.longitude,
      })
    );

    const map = new google.maps.Map(this.mapEl.nativeElement, {
      mapTypeId: 'terrain',
      gestureHandling: 'greedy',
    });
    map.fitBounds(bounds);

    allCatches.forEach((c) => {
      const marker = new google.maps.Marker({
        position: {
          lat: c.displayLocation.latitude,
          lng: c.displayLocation.longitude,
        },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: FISH_SIZE_COLORS[c.caughtSize],
          fillOpacity: 0.9,
          strokeColor: '#000',
          strokeWeight: 1,
        },
      });
      const iw = new google.maps.InfoWindow({
        content: `<div style="font-size:13px">
          <strong>${c.speciesId}</strong><br/>
          ${c.caughtSize} &middot; ${c.caughtLength} cm<br/>
          ${new Date(c.caughtWhen).toLocaleString()}
        </div>`,
      });
      marker.addListener('click', () => iw.open({ anchor: marker, map }));
    });
  }
}
