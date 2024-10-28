import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TripCatchComponent } from './pages/trip-catch/trip-catch.component';
import { DebugDisplayComponent } from './pages/debug-display/debug-display.component';
import { TripsComponent } from './pages/trips/trips.component';
import { NewTripComponent } from './pages/new-trip/new-trip.component';
import { ProfileComponent} from './pages/profile/profile.component';
import { CallbackComponent } from './pages/callback/callback.component';
import { AuthGuard } from './auth.guard';   
import { LandingComponent } from './pages/landing/landing.component';

export const routes: Routes = [
    { path: 'callback', component: CallbackComponent },
    { path: 'trip/:tripid', component: TripCatchComponent, canActivate: [AuthGuard]  },
    { path: 'trips', component: TripsComponent, canActivate: [AuthGuard]  },
    { path: 'newtrip', component: NewTripComponent, canActivate: [AuthGuard]  },
    { path: 'debug', component: DebugDisplayComponent, canActivate: [AuthGuard]  },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard]  },
    { path: 'landing', component: LandingComponent },
    { path: '', redirectTo: '/landing', pathMatch: 'full' },
    { path: '**', redirectTo: '/landing' }    
];
