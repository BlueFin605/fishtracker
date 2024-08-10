import { NgModule } from '@angular/core';
import { DateFormatPipe } from './date-format.pipe';

@NgModule({
  declarations: [DateFormatPipe],
  exports: [DateFormatPipe]
})
export class DateFormatModule {}