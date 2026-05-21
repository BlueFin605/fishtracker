import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ShareDialogComponent } from './share-dialog.component';
import { environment } from '../../../environments/environment';

describe('ShareDialogComponent', () => {
  let fixture: ComponentFixture<ShareDialogComponent>;
  let component: ShareDialogComponent;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/share`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareDialogComponent, FormsModule, HttpClientTestingModule],
    }).compileComponents();
    fixture = TestBed.createComponent(ShareDialogComponent);
    component = fixture.componentInstance;
    component.availableTrips = [
      { tripId: 't1', startTime: '2026-04-20T00:00:00Z', catchCount: 3 },
      { tripId: 't2', startTime: '2026-04-22T00:00:00Z', catchCount: 2 },
    ];
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('disables submit when no trips selected', () => {
    component.recipientEmail = 'b@x.com';
    expect(component.canSubmit).toBeFalse();
  });

  it('disables submit when email invalid', () => {
    component.selectedTripIds.add('t1');
    component.recipientEmail = 'not-email';
    expect(component.canSubmit).toBeFalse();
  });

  it('enables submit when valid', () => {
    component.selectedTripIds.add('t1');
    component.recipientEmail = 'b@x.com';
    expect(component.canSubmit).toBeTrue();
  });

  it('POSTs with expected payload', () => {
    component.selectedTripIds.add('t1');
    component.recipientEmail = 'b@x.com';
    component.fuzzLocation = true;
    component.expiresInDays = 30;
    component.send();
    const req = http.expectOne(base);
    expect(req.request.body).toEqual({
      tripIds: ['t1'],
      recipientEmail: 'b@x.com',
      fuzzLocation: true,
      expiresInDays: 30,
      message: null,
    });
    req.flush({ shareId: 's1', emailSent: true, thumbnailGenerated: true });
  });
});
