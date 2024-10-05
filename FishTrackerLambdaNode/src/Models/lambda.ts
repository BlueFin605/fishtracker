import { DateTime } from 'luxon';
import { DateConverter } from '../Helpers/DateConverter';

// CombinedInterfaces.ts

interface WeatherAttributes {
    fromMajorBiteTime: string; // TimeSpan converted to string
    fromMinorBiteTime: string; // TimeSpan converted to string
    majorBiteTime: DateTime;
    minorBiteTime: DateTime;
    sunSet: DateTime;
    sunRise: DateTime;
    moonSet: DateTime;
    moonRise: DateTime;
    lowTide: DateTime;
    highTide: DateTime;
    tideHeight: number;
    wind: Wind;
}

interface NewCatch {
    speciesId: string;
    caughtLocation: Location;
    caughtWhen?: DateTime;
    timeZone?: string;
    caughtSize: FishSize;
    caughtLength: number;
}

class NewCatchImpl implements NewCatch {
    speciesId: string;
    caughtLocation: Location;
    caughtWhen?: DateTime;
    timeZone?: string;
    caughtSize: FishSize;
    caughtLength: number;

    constructor(
        speciesId: string,
        caughtLocation: Location,
        caughtWhen: DateTime | undefined,
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
    startTime?: DateTime;
    endTime?: DateTime;
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
    startTime: DateTime;
    endTime?: DateTime;
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
    startTime: DateTime;
    endTime?: DateTime;
    notes: string;
    catchSize: number;
    rating: TripRating;
    tags: Set<TripTags>;
    species: string[];
    defaultSpecies: string;

    constructor(
        subject: string,
        tripId: string,
        startTime: DateTime,
        endTime: DateTime | undefined,
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
    endTime?: DateTime;
    notes?: string;
    rating?: TripRating;
    tags?: Set<TripTags>;
}

interface UpdateCatchDetails {
    speciesId?: string;
    caughtLocation?: Location;
    caughtWhen?: DateTime;
    caughtSize?: FishSize;
    caughtLength?: number;
    weather?: WeatherAttributes;
}

interface NewTrip {
    startTime?: DateTime;
    timeZone?: string;
    notes: string;
    tags: Set<TripTags>;
    species: string[];
    defaultSpecies: string;
}

class NewTripImpl implements NewTrip {
    startTime?: DateTime;
    timeZone?: string;
    notes: string;
    tags: Set<TripTags>;
    species: string[];
    defaultSpecies: string;

    constructor(
        startTime: DateTime | undefined,
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
    caughtWhen: DateTime;
    caughtSize: FishSize;
    caughtLength: number;
    weather?: WeatherAttributes;
}

class CatchDetailsImpl implements CatchDetails {
    tripId: string;
    catchId: string;
    speciesId: string;
    caughtLocation: Location;
    caughtWhen: DateTime;
    caughtSize: FishSize;
    caughtLength: number;
    weather?: WeatherAttributes;

    constructor(
        tripId: string,
        catchId: string,
        speciesId: string,
        caughtLocation: Location,
        caughtWhen: DateTime,
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


interface VersionedRecord extends Record<string, any> {
    DynamoDbVersion?: number;
}

interface DynamoDbProfile extends VersionedRecord {
    Subject: string;
    Timezone?: string;
    Species: string[];
    DefaultSpecies: string;
}

class DynamoDbProfileImpl implements DynamoDbProfile {
    Subject: string;
    Timezone?: string;
    Species: string[];
    DefaultSpecies: string;
    DynamoDbVersion?: number;

    constructor(subject: string, timezone: string | undefined, species: string[], defaultSpecies: string, dynamoDbVersion: number | undefined) {
        this.Subject = subject;
        this.Timezone = timezone;
        this.Species = species;
        this.DefaultSpecies = defaultSpecies;
        this.DynamoDbVersion = dynamoDbVersion;
    }
}

interface DynamoDbSettings extends VersionedRecord {
    Settings: string;
    Species: string[];
}

class DynamoDbSettingsImpl implements DynamoDbSettings {
    Settings: string;
    Species: string[];
    DynamoDbVersion?: number;

    constructor(settings: string, species: string[], dynamoDbVersion: number | undefined) {
        this.Settings = settings;
        this.Species = species;
        this.DynamoDbVersion = dynamoDbVersion;
    }

    static createDefault(): DynamoDbSettingsImpl {
        return new DynamoDbSettingsImpl('', [], undefined);
    }
}

interface DynamoDbCatch extends VersionedRecord {
    TripKey: string;
    CatchId: string;
    TripId: string;
    Subject: string;
    SpeciesId: string;
    CaughtLocation: Location;
    CaughtWhen: string;
    CaughtSize: FishSize;
    CaughtLength: number;
    Weather?: WeatherAttributes;
}

class DynamoDbCatchImpl implements DynamoDbCatch {
    TripKey: string;
    CatchId: string;
    TripId: string;
    Subject: string;
    SpeciesId: string;
    CaughtLocation: Location;
    CaughtWhen: string;
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
        CaughtWhen: DateTime,
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
        this.CaughtWhen = DateConverter.isoToString(CaughtWhen);
        this.CaughtSize = CaughtSize;
        this.CaughtLength = CaughtLength;
        this.Weather = Weather;
        this.DynamoDbVersion = DynamoDbVersion;
    }
}

interface DynamoDbTrip extends VersionedRecord {
    Subject: string;
    TripId: string;
    StartTime: string;
    EndTime?: string;
    Notes: string;
    CatchSize: number; // uint converted to number
    Rating: TripRating;
    Tags: TripTags[];
    Species: string[];
    DefaultSpecies: string;
}

class DynamoDbTripImpl implements DynamoDbTrip {
    Subject: string;
    TripId: string;
    StartTime: string;
    EndTime?: string;
    Notes: string;
    CatchSize: number;
    Rating: TripRating;
    Tags: TripTags[];
    Species: string[];
    DefaultSpecies: string;
    DynamoDbVersion?: number;

    constructor(
        subject: string,
        tripId: string,
        startTime: DateTime,
        endTime: DateTime | undefined,
        notes: string,
        catchSize: number,
        rating: TripRating,
        tags: TripTags[],
        species: string[],
        defaultSpecies: string,
        dynamoDbVersion?: number
    ) {
        this.Subject = subject;
        this.TripId = tripId;
        this.StartTime = startTime.toString();
        this.EndTime = endTime?.toString();
        this.Notes = notes;
        this.CatchSize = catchSize;
        this.Rating = rating;
        this.Tags = tags;
        this.Species = species;
        this.DefaultSpecies = defaultSpecies;
        this.DynamoDbVersion = dynamoDbVersion;
    }

    // Default constructor
    static createDefault(): DynamoDbTripImpl {
        return new DynamoDbTripImpl(
            '',
            '',
            DateTime.now(),
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
    VersionedRecord,
    DynamoDbProfile,
    DynamoDbProfileImpl,
    DynamoDbSettings,
    DynamoDbSettingsImpl,
    DynamoDbCatch,
    DynamoDbCatchImpl,
    DynamoDbTrip,
    DynamoDbTripImpl
};