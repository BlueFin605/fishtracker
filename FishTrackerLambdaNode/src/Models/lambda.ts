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

class NewCatchImpl implements NewCatch {
    speciesId: string;
    caughtLocation: Location;
    caughtWhen?: Date;
    timeZone?: string;
    caughtSize: FishSize;
    caughtLength: number;

    constructor(
        speciesId: string,
        caughtLocation: Location,
        caughtWhen: Date | undefined,
        timeZone: string | undefined,
        caughtSize: FishSize,
        caughtLength: number
    ) {
        this.speciesId = speciesId;
        this.caughtLocation = caughtLocation;
        this.caughtWhen = caughtWhen;
        this.timeZone = timeZone;
        this.caughtSize = caughtSize;
        this.caughtLength = caughtLength;
    }
}

interface UpdateTripDetails {
    startTime?: Date;
    endTime?: Date;
    notes?: string;
    catchSize?: number; // uint converted to number
    rating?: TripRating;
    tags?: Set<TripTags>;
    species?: string[];
    defaultSpecies?: string;
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

class TripDetailsImpl implements TripDetails {
    subject: string;
    tripId: string;
    startTime: Date;
    endTime?: Date;
    notes: string;
    catchSize: number;
    rating: TripRating;
    tags: Set<TripTags>;
    species: string[];
    defaultSpecies: string;

    constructor(
        subject: string,
        tripId: string,
        startTime: Date,
        endTime: Date | undefined,
        notes: string,
        catchSize: number,
        rating: TripRating,
        tags: Set<TripTags>,
        species: string[],
        defaultSpecies: string
    ) {
        this.subject = subject;
        this.tripId = tripId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notes = notes;
        this.catchSize = catchSize;
        this.rating = rating;
        this.tags = tags;
        this.species = species;
        this.defaultSpecies = defaultSpecies;
    }
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
    weather?: WeatherAttributes;
}

interface NewTrip {
    startTime?: Date;
    timeZone?: string;
    notes: string;
    tags: Set<TripTags>;
    species: string[];
    defaultSpecies: string;
}

class NewTripImpl implements NewTrip {
    startTime?: Date;
    timeZone?: string;
    notes: string;
    tags: Set<TripTags>;
    species: string[];
    defaultSpecies: string;

    constructor(
        startTime: Date | undefined,
        timeZone: string | undefined,
        notes: string,
        tags: Set<TripTags>,
        species: string[],
        defaultSpecies: string
    ) {
        this.startTime = startTime;
        this.timeZone = timeZone;
        this.notes = notes;
        this.tags = tags;
        this.species = species;
        this.defaultSpecies = defaultSpecies;
    }
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

class CatchDetailsImpl implements CatchDetails {
    tripId: string;
    catchId: string;
    speciesId: string;
    caughtLocation: Location;
    caughtWhen: Date;
    caughtSize: FishSize;
    caughtLength: number;
    weather?: WeatherAttributes;

    constructor(
        tripId: string,
        catchId: string,
        speciesId: string,
        caughtLocation: Location,
        caughtWhen: Date,
        caughtSize: FishSize,
        caughtLength: number,
        weather?: WeatherAttributes
    ) {
        this.tripId = tripId;
        this.catchId = catchId;
        this.speciesId = speciesId;
        this.caughtLocation = caughtLocation;
        this.caughtWhen = caughtWhen;
        this.caughtSize = caughtSize;
        this.caughtLength = caughtLength;
        this.weather = weather;
    }
}

interface Wind {
    speedKnots: number;
    direction: number;
}

interface FishSize {
    length: number;
    weight: number;
}

enum TripRating {
    NonRated = 'NonRated',
    Bust = 'Bust',
    Okay = 'Okay',
    Good = 'Good',
    Fantastic = 'Fantastic',
    OutOfThisWorld = 'OutOfThisWorld'
}

interface TripTags {
    // Define properties for TripTags
}

interface ProfileDetails {
    timeZone?: string;
    species?: string[];
    defaultSpecies?: string;
}

class ProfileDetailsImpl implements ProfileDetails {
    timeZone?: string;
    species?: string[];
    defaultSpecies?: string;

    constructor(timeZone?: string, species?: string[], defaultSpecies?: string) {
        this.timeZone = timeZone;
        this.species = species;
        this.defaultSpecies = defaultSpecies;
    }
}

interface SettingsDetails {
    species?: string[];
}

class SettingsDetailsImpl implements SettingsDetails {
    species?: string[];

    constructor(species?: string[]) {
        this.species = species;
    }
}
//--------------------------------------------
// persistence
//--------------------------------------------

interface DynamoDbProfile {
    subject: string;
    timezone?: string;
    species: string[];
    defaultSpecies: string;
    dynamoDbVersion?: number;
}

class DynamoDbProfileImpl implements DynamoDbProfile {
    subject: string;
    timezone?: string;
    species: string[];
    defaultSpecies: string;
    dynamoDbVersion?: number;

    constructor(subject: string, timezone: string | undefined, species: string[], defaultSpecies: string, dynamoDbVersion: number | undefined) {
        this.subject = subject;
        this.timezone = timezone;
        this.species = species;
        this.defaultSpecies = defaultSpecies;
        this.dynamoDbVersion = dynamoDbVersion;
    }
}

interface DynamoDbSettings {
    settings: string;
    species: string[];
    dynamoDbVersion?: number;
}

class DynamoDbSettingsImpl implements DynamoDbSettings {
    settings: string;
    species: string[];
    dynamoDbVersion?: number;

    constructor(settings: string, species: string[], dynamoDbVersion: number | undefined) {
        this.settings = settings;
        this.species = species;
        this.dynamoDbVersion = dynamoDbVersion;
    }

    static createDefault(): DynamoDbSettingsImpl {
        return new DynamoDbSettingsImpl('', [], undefined);
    }
}

interface DynamoDbCatch {
    TripKey: string;
    CatchId: string;
    TripId: string;
    Subject: string;
    SpeciesId: string;
    CaughtLocation: Location;
    CaughtWhen: Date;
    CaughtSize: FishSize;
    CaughtLength: number;
    Weather?: WeatherAttributes;
    DynamoDbVersion?: number;
}

class DynamoDbCatchImpl implements DynamoDbCatch {
    TripKey: string;
    CatchId: string;
    TripId: string;
    Subject: string;
    SpeciesId: string;
    CaughtLocation: Location;
    CaughtWhen: Date;
    CaughtSize: FishSize;
    CaughtLength: number;
    Weather?: WeatherAttributes;
    DynamoDbVersion?: number;

    constructor(
        TripKey: string,
        CatchId: string,
        TripId: string,
        Subject: string,
        SpeciesId: string,
        CaughtLocation: Location,
        CaughtWhen: Date,
        CaughtSize: FishSize,
        CaughtLength: number,
        Weather?: WeatherAttributes,
        DynamoDbVersion?: number
    ) {
        this.TripKey = TripKey;
        this.CatchId = CatchId;
        this.TripId = TripId;
        this.Subject = Subject;
        this.SpeciesId = SpeciesId;
        this.CaughtLocation = CaughtLocation;
        this.CaughtWhen = CaughtWhen;
        this.CaughtSize = CaughtSize;
        this.CaughtLength = CaughtLength;
        this.Weather = Weather;
        this.DynamoDbVersion = DynamoDbVersion;
    }
}

interface DynamoDbTrip {
    subject: string;
    tripId: string;
    startTime: string;
    endTime?: string;
    notes: string;
    catchSize: number; // uint converted to number
    rating: TripRating;
    tags: TripTags[];
    species: string[];
    defaultSpecies: string;
    dynamoDbVersion?: number;
}

class DynamoDbTripImpl implements DynamoDbTrip {
    subject: string;
    tripId: string;
    startTime: string;
    endTime?: string;
    notes: string;
    catchSize: number;
    rating: TripRating;
    tags: TripTags[];
    species: string[];
    defaultSpecies: string;
    dynamoDbVersion?: number;

    constructor(
        subject: string,
        tripId: string,
        startTime: Date,
        endTime: Date | undefined,
        notes: string,
        catchSize: number,
        rating: TripRating,
        tags: TripTags[],
        species: string[],
        defaultSpecies: string,
        dynamoDbVersion?: number
    ) {
        this.subject = subject;
        this.tripId = tripId;
        this.startTime = startTime.toISOString();
        this.endTime = endTime?.toISOString();
        this.notes = notes;
        this.catchSize = catchSize;
        this.rating = rating;
        this.tags = tags;
        this.species = species;
        this.defaultSpecies = defaultSpecies;
        this.dynamoDbVersion = dynamoDbVersion;
    }

    // Default constructor
    static createDefault(): DynamoDbTripImpl {
        return new DynamoDbTripImpl(
            '',
            '',
            new Date(),
            undefined,
            '',
            0,
            TripRating.NonRated,
            [],
            [],
            ''
        );
    }
}

export {
    WeatherAttributes,
    NewCatch,
    NewCatchImpl,
    UpdateTripDetails,
    TripDetails,
    TripDetailsImpl,
    EndTripDetails,
    UpdateCatchDetails,
    NewTrip,
    NewTripImpl,
    Location,
    CatchDetails,
    CatchDetailsImpl,
    Wind,
    FishSize,
    TripRating,
    TripTags,
    ProfileDetails,
    ProfileDetailsImpl,
    SettingsDetails,
    SettingsDetailsImpl,
    DynamoDbProfile,
    DynamoDbProfileImpl,
    DynamoDbSettings,
    DynamoDbSettingsImpl,
    DynamoDbCatch,
    DynamoDbCatchImpl,
    DynamoDbTrip,
    DynamoDbTripImpl
};