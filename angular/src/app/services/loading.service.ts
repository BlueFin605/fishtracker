import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  private loadingCounter = 0;

  show() {
    this.loadingCounter++;
    if (this.loadingCounter === 1) {
      console.log('show loading');
      this.loadingSubject.next(true);
    }
  }

  hide() {
    if (this.loadingCounter > 0) {
      this.loadingCounter--;
      if (this.loadingCounter === 0) {
        console.log('hide loading');
        this.loadingSubject.next(false);
      }
    }
  }
}