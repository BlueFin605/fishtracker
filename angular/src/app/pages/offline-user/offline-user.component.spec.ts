import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { OfflineUserComponent } from './offline-user.component';
import { LocalUsersRegistry, KnownUser } from '../../services/local-users-registry.service';
import { SessionService } from '../../services/session.service';

describe('OfflineUserComponent', () => {
  let users: KnownUser[];
  let enterProxy: jasmine.Spy;
  let navigate: jasmine.Spy;
  let query: Record<string, string>;

  function create() {
    const fixture = TestBed.createComponent(OfflineUserComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    users = [];
    query = {};
    enterProxy = jasmine.createSpy('enterProxy');
    TestBed.configureTestingModule({
      imports: [OfflineUserComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { get queryParamMap() { return convertToParamMap(query); } } } },
        { provide: LocalUsersRegistry, useValue: { list: () => users } },
        { provide: SessionService, useValue: { enterProxy } },
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  it('redirects to /login with no known users', () => {
    create();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(enterProxy).not.toHaveBeenCalled();
  });

  it('auto-enters proxy with exactly one user', () => {
    users = [{ sub: 'a', name: 'Ann', email: 'a@x' }];
    create();
    expect(enterProxy).toHaveBeenCalledWith('a');
    expect(navigate).toHaveBeenCalledWith(['/trips']);
  });

  it('lists a button per user with two or more', () => {
    users = [{ sub: 'a', name: 'Ann', email: 'a@x' }, { sub: 'b', name: 'Bob', email: 'b@x' }];
    const fixture = create();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1,h2')?.textContent).toContain("Who's fishing?");
    const buttons = el.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Ann');
    expect(buttons[0].textContent).toContain('a@x');
    expect(enterProxy).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clicking a user enters proxy and goes to /trips', () => {
    users = [{ sub: 'a', name: 'Ann', email: 'a@x' }, { sub: 'b', name: 'Bob', email: 'b@x' }];
    const fixture = create();
    (fixture.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement).click();
    expect(enterProxy).toHaveBeenCalledWith('b');
    expect(navigate).toHaveBeenCalledWith(['/trips']);
  });

  describe('arriving from an explicit proxy exit', () => {
    beforeEach(() => { query = { exited: '1' }; });

    it('does not auto-enter with exactly one user; shows the picker', () => {
      users = [{ sub: 'a', name: 'Ann', email: 'a@x' }];
      const fixture = create();
      expect(enterProxy).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
    });

    it('still redirects to /login with no known users', () => {
      create();
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
