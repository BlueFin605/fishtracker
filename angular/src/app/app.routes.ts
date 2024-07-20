import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TripCatchComponent } from './pages/trip-catch/trip-catch.component';
import { DebugDisplayComponent } from './pages/debug-display/debug-display.component';
import { TripsComponent } from './pages/trips/trips.component';
import { NewTripComponent } from './pages/new-trip/new-trip.component';

export const routes: Routes = [
    { path: 'trip', component: TripCatchComponent },
    { path: 'trips', component: TripsComponent },
    { path: 'newtrip', component: NewTripComponent },
    { path: 'debug', component: DebugDisplayComponent }
];
