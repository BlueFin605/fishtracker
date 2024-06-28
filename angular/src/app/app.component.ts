import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component'; // Import the app-header component with correct path
// import { Routes } from './app.routes'; // Import the app.routes file with correct path
// import { RouterModule } from '@angular/router'; // Import RouterModule separately

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, 
            HeaderComponent,
           ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fishtracker';
}

// Import RouterModule.forRoot(Routes) in the application bootstrap
