import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugDisplayComponent } from './debug-display.component';

describe('DebugDisplayComponent', () => {
  let component: DebugDisplayComponent;
  let fixture: ComponentFixture<DebugDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebugDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DebugDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
