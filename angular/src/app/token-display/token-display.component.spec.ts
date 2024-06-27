import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenDisplayComponent } from './token-display.component';

describe('TokenDisplayComponent', () => {
  let component: TokenDisplayComponent;
  let fixture: ComponentFixture<TokenDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TokenDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
