import { TestBed } from '@angular/core/testing';

import { DateConversionService } from './date-conversion.service';

describe('DateConversionService', () => {
  let service: DateConversionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateConversionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
