import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { TripCatchComponent } from './trip-catch.component';

describe('TripCatchComponent', () => {
  let component: TripCatchComponent;
  let fixture: ComponentFixture<TripCatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripCatchComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map()),
            snapshot: { paramMap: { get: () => null } },
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripCatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
