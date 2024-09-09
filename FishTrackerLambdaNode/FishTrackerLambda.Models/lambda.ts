// CombinedInterfaces.ts

interface WeatherAttributes {
    fromMajorBiteTime: string; // TimeSpan converted to string
    fromMinorBiteTime: string; // TimeSpan converted to string
    majorBiteTime: Date;
    minorBiteTime: Date;
    sunSet: Date;
    sunRise: Date;
    moonSet: Date;
    moonRise: Date;
    lowTide: Date;
    highTide: Date;
    tideHeight: number;
    wind: Wind;
}

interface NewCatch {
    speciesId: string;
    caughtLocation: Location;
    caughtWhen?: Date;
    timeZone?: string;
    caughtSize: FishSize;
    caughtLength: number;
}

interface UpdateTripDetails {
    // Add properties here
}

interface TripDetails {
    subject: string;
    tripId: string;
    startTime: Date;
    endTime?: Date;
    notes: string;
    catchSize: number; // uint converted to number
    rating: TripRating;
    tags: Set<TripTags>;
    species: string[];
    defaultSpecies: string;
}

interface EndTripDetails {
    timeZone?: string;
    endTime?: Date;
    notes?: string;
    rating?: TripRating;
    tags?: Set<TripTags>;
}

interface UpdateCatchDetails {
    speciesId?: string;
    caughtLocation?: Location;
    caughtWhen?: Date;
    caughtSize?: FishSize;
    caughtLength?: number;
}

interface NewTrip {
    startTime?: Date;
    timeZone?: string;
    notes: string;
    tags: Set<TripTags>;
    species: string[];
    defaultSpecies: string;
}

interface Location {
    longitude: number;
    latitude: number;
}

interface CatchDetails {
    tripId: string;
    catchId: string; // Guid converted to string
    speciesId: string;
    caughtLocation: Location;
    caughtWhen: Date;
    caughtSize: FishSize;
    caughtLength: number;
    weather?: WeatherAttributes;
}

interface Wind {
    speedKnots: number;
    direction: number;
}

interface FishSize {
    length: number;
    weight: number;
}

interface TripRating {
    // Define properties for TripRating
}

interface TripTags {
    // Define properties for TripTags
}

export {
    WeatherAttributes,
    NewCatch,
    UpdateTripDetails,
    TripDetails,
    EndTripDetails,
    UpdateCatchDetails,
    NewTrip,
    Location,
    CatchDetails,
    Wind,
    FishSize,
    TripRating,
    TripTags
};