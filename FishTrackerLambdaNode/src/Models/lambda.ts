import { DateTime } from 'luxon';
import { DateConverter } from '../Helpers/DateConverter';

// Combinedexport interfaces.ts

export interface IWeatherAttributes {
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
    wind: IWind;
}

export interface INewCatch {
    speciesId: string;
    caughtLocation: ILocation;
    caughtWhen?: DateTime;
    timeZone?: string;
    caughtSize: IFishSize;
    caughtLength: number;
}

export class NewCatch implements INewCatch {
    speciesId: string;
    caughtLocation: ILocation;
    caughtWhen?: DateTime;
    timeZone?: string;
    caughtSize: IFishSize;
    caughtLength: number;

    constructor(
        speciesId: string,
        caughtLocation: ILocation,
        caughtWhen: DateTime | undefined,
        timeZone: string | undefined,
        caughtSize: IFishSize,
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

export interface IUpdateTripDetails {
    startTime?: DateTime;
    endTime?: DateTime;
    notes?: string;
    catchSize?: number; // uint converted to number
    rating?: TripRating;
    tags?: Set<ITripTags>;
    species?: string[];
    defaultSpecies?: string;
}

export interface ITripDetails {
    subject: string;
    tripId: string;
    startTime: DateTime;
    endTime?: DateTime;
    notes: string;
    catchSize: number; // uint converted to number
    rating: TripRating;
    tags: ITripTags[];
    species: string[];
    defaultSpecies: string;
}

export class TripDetails implements ITripDetails {
    subject: string;
    tripId: string;
    startTime: DateTime;
    endTime?: DateTime;
    notes: string;
    catchSize: number;
    rating: TripRating;
    tags: ITripTags[];
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
        tags: ITripTags[],
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

export interface IEndTripDetails {
    timeZone?: string;
    endTime?: DateTime;
    notes?: string;
    rating?: TripRating;
    tags?: Set<ITripTags>;
}

export interface IUpdateCatchDetails {
    speciesId?: string;
    caughtLocation?: ILocation;
    caughtWhen?: DateTime;
    caughtSize?: IFishSize;
    caughtLength?: number;
    weather?: IWeatherAttributes;
}

export interface INewTrip {
    startTime?: DateTime;
    timeZone?: string;
    notes: string;
    tags: Set<ITripTags>;
    species: string[];
    defaultSpecies: string;
}

export class NewTrip implements INewTrip {
    startTime?: DateTime;
    timeZone?: string;
    notes: string;
    tags: Set<ITripTags>;
    species: string[];
    defaultSpecies: string;

    constructor(
        startTime: DateTime | undefined,
        timeZone: string | undefined,
        notes: string,
        tags: Set<ITripTags>,
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

export interface ILocation {
    longitude: number;
    latitude: number;
}

export interface ICatchDetails {
    tripId: string;
    catchId: string; // Guid converted to string
    speciesId: string;
    caughtLocation: ILocation;
    caughtWhen: DateTime;
    caughtSize: IFishSize;
    caughtLength: number;
    weather?: IWeatherAttributes;
}

export class CatchDetails implements ICatchDetails {
    tripId: string;
    catchId: string;
    speciesId: string;
    caughtLocation: ILocation;
    caughtWhen: DateTime;
    caughtSize: IFishSize;
    caughtLength: number;
    weather?: IWeatherAttributes;

    constructor(
        tripId: string,
        catchId: string,
        speciesId: string,
        caughtLocation: ILocation,
        caughtWhen: DateTime,
        caughtSize: IFishSize,
        caughtLength: number,
        weather?: IWeatherAttributes
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

export interface IWind {
    speedKnots: number;
    direction: number;
}

export interface IFishSize {
    length: number;
    weight: number;
}

export enum TripRating {
    NonRated = 'NonRated',
    Bust = 'Bust',
    Okay = 'Okay',
    Good = 'Good',
    Fantastic = 'Fantastic',
    OutOfThisWorld = 'OutOfThisWorld'
}

export interface ITripTags {
    // Define properties for TripTags
}

export interface IProfileDetails {
    timeZone?: string;
    species?: string[];
    defaultSpecies?: string;
}

export class ProfileDetails implements IProfileDetails {
    timeZone?: string;
    species?: string[];
    defaultSpecies?: string;

    constructor(timeZone?: string, species?: string[], defaultSpecies?: string) {
        this.timeZone = timeZone;
        this.species = species;
        this.defaultSpecies = defaultSpecies;
    }
}

export interface ISettingsDetails {
    species?: string[];
}

export class SettingsDetails implements ISettingsDetails {
    species?: string[];

    constructor(species?: string[]) {
        this.species = species;
    }
}
//--------------------------------------------
// persistence
//--------------------------------------------


export interface IVersionedRecord extends Record<string, any> {
    DynamoDbVersion?: number;
}

export interface IDynamoDbProfile extends IVersionedRecord {
    Subject: string;
    Timezone?: string;
    Species: string[];
    DefaultSpecies: string;
}

export class DynamoDbProfile implements IDynamoDbProfile {
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

export interface IDynamoDbSettings extends IVersionedRecord {
    Settings: string;
    Species: string[];
}

export class DynamoDbSettings implements IDynamoDbSettings {
    Settings: string;
    Species: string[];
    DynamoDbVersion?: number;

    constructor(settings: string, species: string[], dynamoDbVersion: number | undefined) {
        this.Settings = settings;
        this.Species = species;
        this.DynamoDbVersion = dynamoDbVersion;
    }

    static createDefault(): DynamoDbSettings {
        return new DynamoDbSettings('', [], undefined);
    }
}

export interface IDynamoDbCatch extends IVersionedRecord {
    TripKey: string;
    CatchId: string;
    TripId: string;
    Subject: string;
    SpeciesId: string;
    CaughtLocation: ILocation;
    CaughtWhen: string;
    CaughtSize: IFishSize;
    CaughtLength: number;
    Weather?: IWeatherAttributes;
}

export class DynamoDbCatch implements IDynamoDbCatch {
    TripKey: string;
    CatchId: string;
    TripId: string;
    Subject: string;
    SpeciesId: string;
    CaughtLocation: ILocation;
    CaughtWhen: string;
    CaughtSize: IFishSize;
    CaughtLength: number;
    Weather?: IWeatherAttributes;
    DynamoDbVersion?: number;

    constructor(
        TripKey: string,
        CatchId: string,
        TripId: string,
        Subject: string,
        SpeciesId: string,
        CaughtLocation: ILocation,
        CaughtWhen: DateTime,
        CaughtSize: IFishSize,
        CaughtLength: number,
        Weather?: IWeatherAttributes,
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

export interface IDynamoDbTrip extends IVersionedRecord {
    Subject: string;
    TripId: string;
    StartTime: string;
    EndTime?: string;
    Notes: string;
    CatchSize: number; // uint converted to number
    Rating: TripRating;
    Tags: ITripTags[];
    Species: string[];
    DefaultSpecies: string;
}

export class DynamoDbTrip implements IDynamoDbTrip {
    Subject: string;
    TripId: string;
    StartTime: string;
    EndTime?: string;
    Notes: string;
    CatchSize: number;
    Rating: TripRating;
    Tags: ITripTags[];
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
        tags: ITripTags[],
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
    static createDefault(): DynamoDbTrip {
        return new DynamoDbTrip(
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
