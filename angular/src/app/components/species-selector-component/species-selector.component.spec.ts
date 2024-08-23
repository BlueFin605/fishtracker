import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeciesSelectorComponentComponent } from './species-selector.component';

describe('SpeciesSelectorComponentComponent', () => {
  let component: SpeciesSelectorComponentComponent;
  let fixture: ComponentFixture<SpeciesSelectorComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeciesSelectorComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeciesSelectorComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
