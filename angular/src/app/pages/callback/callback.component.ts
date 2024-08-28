import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-callback',
  template: '<p>Loading...</p>'
})
export class CallbackComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    console.log('Full URL:', window.location.href);
    console.log('Hash    :', window.location.hash);

    const fragment = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = fragment.get('access_token');
    const idToken = fragment.get('id_token');

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }

    if (idToken) {
      localStorage.setItem('id_token', idToken);
    }

    this.router.navigate(['/']);  }
}