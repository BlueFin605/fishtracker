import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripCatchComponent } from './trip-catch.component';

describe('TripCatchComponent', () => {
  let component: TripCatchComponent;
  let fixture: ComponentFixture<TripCatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripCatchComponent]
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
