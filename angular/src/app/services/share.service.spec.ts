import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ShareService } from './share.service';
import { environment } from '../../environments/environment';

describe('ShareService', () => {
  let svc: ShareService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/share`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ShareService],
    });
    svc = TestBed.inject(ShareService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs a new share', () => {
    svc
      .create({
        tripIds: ['t1'],
        recipientEmail: 'b@x',
        fuzzLocation: true,
        expiresInDays: 30,
        message: null,
      })
      .subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({ shareId: 's1', emailSent: true, thumbnailGenerated: true });
  });

  it('GETs outbox list', () => {
    svc.list('outbox').subscribe();
    http.expectOne(`${base}?direction=outbox`).flush([]);
  });

  it('GETs inbox list', () => {
    svc.list('inbox').subscribe();
    http.expectOne(`${base}?direction=inbox`).flush([]);
  });

  it('GETs detail by id', () => {
    svc.get('s1').subscribe();
    http.expectOne(`${base}/s1`).flush({});
  });

  it('DELETEs to revoke', () => {
    svc.revoke('s1').subscribe();
    const req = http.expectOne(`${base}/s1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
