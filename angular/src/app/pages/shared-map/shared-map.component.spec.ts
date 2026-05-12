import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SharedMapPageComponent } from './shared-map.component';
import { GoogleMapsLoaderService } from '../../google-maps-loader.service';
import { AuthenticationService } from '../../services/authentication.service';
import { environment } from '../../../environments/environment';

describe('SharedMapPageComponent', () => {
  let fixture: ComponentFixture<SharedMapPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedMapPageComponent, HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ shareId: 's1' }) },
          },
        },
        {
          provide: GoogleMapsLoaderService,
          useValue: { loadScript: () => Promise.resolve() },
        },
        {
          provide: AuthenticationService,
          useValue: { userEmail: 'me@x.com' },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SharedMapPageComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders "no longer available" on 410', () => {
    fixture.detectChanges();
    const req = http.expectOne(`${environment.apiUrl}/share/s1`);
    req.flush('', { status: 410, statusText: 'Gone' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no longer available');
  });
});
