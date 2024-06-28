// import { TestBed } from '@angular/core/testing';
// import { AppComponent } from './app.component';
// import { AuthService } from '@auth0/auth0-angular';

// describe('AppComponent', () => {
//   let authServiceSpy: unknown;
//   beforeEach(async () => {
//     authServiceSpy = jasmine.createSpyObj('AuthService', ['loginWithRedirect','getAccessTokenSilently']);
//     await TestBed.configureTestingModule({
//       providers: [
//         {
//           provide: AuthService,
//           useValue: authServiceSpy,
//         },
//       ],
//       imports: [AppComponent],
//     }).compileComponents();
//   });

//   it('should create the app', () => {
//     const fixture = TestBed.createComponent(AppComponent);
//     const app = fixture.componentInstance;
//     expect(app).toBeTruthy();
//   });

//   it(`should have the 'fishtracker' title`, () => {
//     const fixture = TestBed.createComponent(AppComponent);
//     const app = fixture.componentInstance;
//     expect(app.title).toEqual('fishtracker');
//   });

//   it('should render title', () => {
//     const fixture = TestBed.createComponent(AppComponent);
//     fixture.detectChanges();
//     const compiled = fixture.nativeElement as HTMLElement;
//     expect(compiled.querySelector('h1')?.textContent).toContain('Hello, fishtracker');
//   });
// });
