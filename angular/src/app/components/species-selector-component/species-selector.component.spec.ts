import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeciesSelector } from './species-selector.component';

describe('SpeciesSelectorComponentComponent', () => {
  let component: SpeciesSelector;
  let fixture: ComponentFixture<SpeciesSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeciesSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeciesSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
