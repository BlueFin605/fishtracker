import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MySharesPageComponent } from './my-shares.component';
import { environment } from '../../../environments/environment';

describe('MySharesPageComponent', () => {
  let fixture: ComponentFixture<MySharesPageComponent>;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/share`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MySharesPageComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MySharesPageComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads sent tab on init', () => {
    fixture.detectChanges();
    http.expectOne(`${base}?direction=outbox`).flush([]);
  });

  it('switches to received tab', () => {
    fixture.detectChanges();
    http.expectOne(`${base}?direction=outbox`).flush([]);
    fixture.componentInstance.switchTo('received');
    http.expectOne(`${base}?direction=inbox`).flush([]);
  });
});
