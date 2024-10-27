import { DateTime } from 'luxon';
import { DateConverter } from '../Helpers/DateConverter';

// Combinedexport interfaces.ts

export interface IBiteTime {
    start: string;
    end: string;
}

export interface IBiteTimesDetails {
    moonPhase: string;
    majorBiteTimes: IBiteTime[];
    minorBiteTimes: IBiteTime[];
    sunrise: string;
    sunset: string;
    moonrise?: string;
    moonset?: string;
    moonover?: string;
    moonunder?: string;
    timeToSunrise?: string;
    timeToSunset?: string;
    biteTimeState: string;
}

export interface INewCatch {
    speciesId: string;
    caughtLocation: ILocation;
    caughtWhen?: string;
    timeZone: string;
    caughtSize: string;
    caughtLength: number;
}

export class NewCatch implements INewCatch {
    speciesId: string;
    caughtLocation: ILocation;
    caughtWhen?: string;
    timeZone: string;
    caughtSize: string;
    caughtLength: number;

    constructor(
        speciesId: string,
        caughtLocation: ILocation,
        caughtWhen: string | undefined,
        timeZone: string,
        caughtSize: string,
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
    startTime?: string;
    endTime?: string;
    notes?: string;
    catchSize?: number; // uint converted to number
    rating?: TripRating;
    tags?: Set<ITripTags>;
    species?: string[];
    defaultSpecies?: string;
    moonPhase?: string;
}

export interface ITripDetails {
    subject: string;
    tripId: string;
    startTime: string;
    endTime?: string;
    notes: string;
    catchSize: number; // uint converted to number
    rating: string;
    tags: ITripTags[];
    species: string[];
    defaultSpecies: string;
    moonPhase: string;
}

export class TripDetails implements ITripDetails {
    subject: string;
    tripId: string;
    startTime: string;
    endTime?: string;
    notes: string;
    catchSize: number;
    rating: string;
    tags: ITripTags[];
    species: string[];
    defaultSpecies: string;
    moonPhase: string;

    constructor(
        subject: string,
        tripId: string,
        startTime: string,
        endTime: string | undefined,
        notes: string,
        catchSize: number,
        rating: string,
        tags: ITripTags[],
        species: string[],
        defaultSpecies: string,
        moonPhase: string
    ) {
        this.subject = subject;
        this.tripId = tripId;
        this.startTime = startTime;
        this.endTime = endTime == undefined? undefined : endTime;
        this.notes = notes;
        this.catchSize = catchSize;
        this.rating = rating;
        this.tags = tags;
        this.species = species;
        this.defaultSpecies = defaultSpecies;
        this.moonPhase = moonPhase;
    }
}

export interface IEndTripDetails {
    timeZone: string;
    endTime?: string;
    notes?: string;
    rating?: TripRating;
    tags?: Set<ITripTags>;
}

export interface IUpdateCatchDetails {
    speciesId?: string;
    caughtLocation?: ILocation;
    caughtWhen?: string;
    caughtSize?: string;
    caughtLength?: number;
    biteInfo?: IBiteTimesDetails;
}

export interface INewTrip {
    startTime?: string;
    timeZone: string;
    notes: string;
    tags: Set<ITripTags>;
    species: string[];
    defaultSpecies: string;
}

export class NewTrip implements INewTrip {
    startTime?: string;
    timeZone: string;
    notes: string;
    tags: Set<ITripTags>;
    species: string[];
    defaultSpecies: string;

    constructor(
        startTime: string | undefined,
        timeZone: string,
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
    caughtWhen: string;
    caughtSize: string | undefined;
    caughtLength: number;
    biteInfo?: IBiteTimesDetails;
}

export class CatchDetails implements ICatchDetails {
    tripId: string;
    catchId: string;
    speciesId: string;
    caughtLocation: ILocation;
    caughtWhen: string;
    caughtSize: string | undefined;
    caughtLength: number;
    biteInfo?: IBiteTimesDetails;

    constructor(
        tripId: string,
        catchId: string,
        speciesId: string,
        caughtLocation: ILocation,
        caughtWhen: string,
        caughtSize: string | undefined,
        caughtLength: number,
        biteInfo?: IBiteTimesDetails
    ) {
        this.tripId = tripId;
        this.catchId = catchId;
        this.speciesId = speciesId;
        this.caughtLocation = caughtLocation;
        this.caughtWhen = caughtWhen;
        this.caughtSize = caughtSize;
        this.caughtLength = caughtLength;
        this.biteInfo = biteInfo;
    }
}

export interface IWind {
    speedKnots: number;
    direction: number;
}

export enum FishSize
{
    Undersize,
    Small,
    Medium,
    Large,
    VeryLarge
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
    CaughtSize: FishSize | undefined;
    CaughtLength: number;
    BiteInfo?: IBiteTimesDetails;
}

export class DynamoDbCatch implements IDynamoDbCatch {
    TripKey: string;
    CatchId: string;
    TripId: string;
    Subject: string;
    SpeciesId: string;
    CaughtLocation: ILocation;
    CaughtWhen: string;
    CaughtSize: FishSize | undefined;
    CaughtLength: number;
    BiteInfo?: IBiteTimesDetails;
    DynamoDbVersion?: number;

    constructor(
        TripKey: string,
        CatchId: string,
        TripId: string,
        Subject: string,
        SpeciesId: string,
        CaughtLocation: ILocation,
        CaughtWhen: string,
        CaughtSize: FishSize | undefined,
        CaughtLength: number,
        BiteInfo?: IBiteTimesDetails,
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
        this.BiteInfo = BiteInfo;
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
    MoonPhase: string;
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
    MoonPhase: string;
    DynamoDbVersion?: number;

    constructor(
        subject: string,
        tripId: string,
        startTime: string,
        endTime: string | undefined,
        notes: string,
        catchSize: number,
        rating: TripRating,
        tags: ITripTags[],
        species: string[],
        defaultSpecies: string,
        moonPhase: string,
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
        this.MoonPhase = moonPhase;
        this.DynamoDbVersion = dynamoDbVersion;
    }

    // Default constructor
    static createDefault(): DynamoDbTrip {
        return new DynamoDbTrip(
            '',
            '',
            DateConverter.isoToString(DateTime.now()),
            undefined,
            '',
            0,
            TripRating.NonRated,
            [],
            [],
            '',
            'Unknown'
        );
    }
}
