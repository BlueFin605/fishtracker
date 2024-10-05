import { injectable } from 'tsyringe';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { DynamoDbTrip, DynamoDbTripImpl, UpdateTripDetails, TripDetails, TripDetailsImpl, EndTripDetails, NewTrip, NewTripImpl, TripRating, TripTags } from '../Models/lambda';
import { IdGenerator } from '../Helpers/IdGenerator';
import { DateConverter } from '../Helpers/DateConverter';
import { DynamoDbHelper } from './AWSWrapper';

@injectable()
export class TripDbService extends DynamoDbService<DynamoDbTrip> {
    constructor(client: DynamoDbHelper) {
        super(client, 'FishTracker-Trip-Prod', 'Subject', 'TripId');
    }

    async updateTripInDynamoDb(record: DynamoDbTrip): Promise<HttpWrapper<DynamoDbTrip>> {
        return this.updateRecord('Subject', record.Subject, 'TripId', record.TripId, record);
    }

    async readRelevantTripsFromDynamoDb(subject: string): Promise<HttpWrapper<DynamoDbTrip[]>> {
        const month = new Date().getMonth();
        const startSortValue = IdGenerator.generateTripKey(subject, (month - 1).toString().padStart(2, '0'));
        const endSortValue = IdGenerator.generateTripKey(subject, (month + 2).toString().padStart(2, '0'));
        return this.readRecordsBetweenSortKeys(subject, startSortValue, endSortValue);
    }

    static patchTrip(record: DynamoDbTrip, trip: UpdateTripDetails): DynamoDbTrip {
        return new DynamoDbTripImpl(
            record.Subject,
            record.TripId,
            trip.startTime ?? DateConverter.isoFromString(record.StartTime),
            trip.endTime ?? (record.EndTime ? DateConverter.isoFromString(record.EndTime) : undefined),
            TripDbService.appendNotes(record.Notes, trip.notes),
            trip.catchSize ?? record.CatchSize,
            trip.rating ?? record.Rating,
            Array.isArray(trip.tags) ? trip.tags : [...record.Tags],
            trip.species ?? record.Species,
            trip.defaultSpecies ?? record.DefaultSpecies,
            record.DynamoDbVersion
        );
    }

    static updateTrip(record: DynamoDbTrip, trip: TripDetails): DynamoDbTrip {
        return new DynamoDbTripImpl(
            record.Subject,
            record.TripId,
            trip.startTime,
            trip.endTime,
            trip.notes,
            trip.catchSize,
            trip.rating,
            [...trip.tags],
            trip.species,
            trip.defaultSpecies,
            record.DynamoDbVersion
        );
    }

    endTrip(record: DynamoDbTrip, trip: EndTripDetails, size: number): DynamoDbTrip {
        const endTime = trip.endTime ?? DateConverter.getLocalNow(trip.timeZone);
        return new DynamoDbTripImpl(
            record.Subject,
            record.TripId,
            DateConverter.isoFromString(record.StartTime),
            endTime,
            TripDbService.appendNotes(record.Notes, trip.notes),
            size,
            trip.rating ?? record.Rating,
            Array.isArray(trip.tags) ? trip.tags : Array.from(trip.tags ?? record.Tags),
            record.Species,
            record.DefaultSpecies,
            record.DynamoDbVersion
        );
    }

    static fillInMissingData(newTrip: NewTrip): NewTrip {
        const startTime = newTrip.startTime ?? DateConverter.getLocalNow(newTrip.timeZone);
        return new NewTripImpl(startTime, newTrip.timeZone, newTrip.notes, newTrip.tags, newTrip.species, newTrip.defaultSpecies);
    }

    static createNewDynamoRecord(newTrip: NewTrip, subject: string): DynamoDbTrip {
        if (!newTrip.startTime) {
            throw new Error('Trip start time is required');
        }
        
        return new DynamoDbTripImpl(
            subject,
            IdGenerator.generateTripId(newTrip.startTime),
            newTrip.startTime,
            undefined,
            newTrip.notes,
            0,
            TripRating.NonRated,
            [...(newTrip.tags ?? [])],
            newTrip.species ?? [],
            newTrip.defaultSpecies ?? '',
            undefined
        );
    }

    static toTripDetails(record: DynamoDbTrip): TripDetails {
        return new TripDetailsImpl(
            record.Subject,
            record.TripId,
            DateConverter.isoFromString(record.StartTime),
            record.EndTime ? DateConverter.isoFromString(record.EndTime) : undefined,
            record.Notes,
            record.CatchSize,
            record.Rating,
            new Set(record.Tags),
            record.Species,
            record.DefaultSpecies
        );
    }

    static appendNotes(notes?: string, append?: string): string {
        if (!append) return notes ?? '';
        if (!notes) return append;
        return `${notes}\r\n${append}`;
    }
}