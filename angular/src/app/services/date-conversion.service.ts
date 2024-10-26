import { Injectable } from '@angular/core';
import { toZonedTime } from 'date-fns-tz';
import { formatISO } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class DateConversionService {

  constructor() { }

  createLocalDate(date: Date | undefined, timeZone: string): string | undefined {
    if (!date)
      return undefined;

    const zonedTime = toZonedTime(date, timeZone);
    return formatISO(zonedTime);
  }
}
