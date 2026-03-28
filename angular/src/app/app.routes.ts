import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TripCatchComponent } from './pages/trip-catch/trip-catch.component';
import { DebugDisplayComponent } from './pages/debug-display/debug-display.component';
import { TripsComponent } from './pages/trips/trips.component';
import { NewTripComponent } from './pages/new-trip/new-trip.component';
import { ProfileComponent} from './pages/profile/profile.component';
import { CallbackComponent } from './pages/callback/callback.component';
import { SetupComponent } from './pages/setup/setup.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AuthGuard } from './auth.guard';
import { SetupGuard } from './setup.guard';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
    { path: 'callback', component: CallbackComponent },
    { path: 'setup', component: SetupComponent, canActivate: [AuthGuard] },
    { path: 'trip/:tripid', component: TripCatchComponent, canActivate: [AuthGuard, SetupGuard]  },
    { path: 'trips', component: TripsComponent, canActivate: [AuthGuard, SetupGuard]  },
    { path: 'newtrip', component: NewTripComponent, canActivate: [AuthGuard, SetupGuard]  },
    { path: 'debug', component: DebugDisplayComponent, canActivate: [AuthGuard]  },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard]  },
    { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard]  },
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
