import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { DynamoDbTrip, DynamoDbTripImpl, UpdateTripDetails, TripDetails, TripDetailsImpl, EndTripDetails, NewTrip, NewTripImpl, TripRating, TripTags } from '../Models/lambda';
import { IdGenerator } from '../Helpers/IdGenerator';
import { DateConverter } from '../Helpers/DateConverter';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export class TripDbService extends DynamoDbService<DynamoDbTrip> {
    constructor(client: DynamoDBClient) {
        super(client, 'FishTracker-Trip-Prod', 'Subject', 'TripId');
    }

    async updateTripInDynamoDb(record: DynamoDbTrip): Promise<HttpWrapper<DynamoDbTrip>> {
        return this.updateRecord('Subject', record.subject, 'TripId', record.tripId, record);
    }

    async readRelevantTripsFromDynamoDb(subject: string): Promise<HttpWrapper<DynamoDbTrip[]>> {
        const month = new Date().getMonth();
        const startSortValue = IdGenerator.generateTripKey(subject, (month - 1).toString().padStart(2, '0'));
        const endSortValue = IdGenerator.generateTripKey(subject, (month + 2).toString().padStart(2, '0'));
        return this.readRecordsBetweenSortKeys(subject, startSortValue, endSortValue);
    }

    patchTrip(record: DynamoDbTrip, trip: UpdateTripDetails): DynamoDbTrip {
        return new DynamoDbTripImpl(
            record.subject,
            record.tripId,
            trip.startTime ?? DateConverter.isoFromString(record.startTime),
            trip.endTime ?? (record.endTime ? DateConverter.isoFromString(record.endTime) : undefined),
            this.appendNotes(record.notes, trip.notes),
            trip.catchSize ?? record.catchSize,
            trip.rating ?? record.rating,
            Array.isArray(trip.tags) ? trip.tags : [...record.tags],
            trip.species ?? record.species,
            trip.defaultSpecies ?? record.defaultSpecies,
            record.dynamoDbVersion
        );
    }

    updateTrip(record: DynamoDbTrip, trip: TripDetails): DynamoDbTrip {
        return new DynamoDbTripImpl(
            record.subject,
            record.tripId,
            trip.startTime,
            trip.endTime,
            trip.notes,
            trip.catchSize,
            trip.rating,
            [...trip.tags],
            trip.species,
            trip.defaultSpecies,
            record.dynamoDbVersion
        );
    }

    endTrip(record: DynamoDbTrip, trip: EndTripDetails, size: number): DynamoDbTrip {
        const endTime = trip.endTime ?? DateConverter.getLocalNow(trip.timeZone);
        return new DynamoDbTripImpl(
            record.subject,
            record.tripId,
            DateConverter.isoFromString(record.startTime),
            endTime,
            this.appendNotes(record.notes, trip.notes),
            size,
            trip.rating ?? record.rating,
            Array.isArray(trip.tags) ? trip.tags : Array.from(trip.tags ?? record.tags),
            record.species,
            record.defaultSpecies,
            record.dynamoDbVersion
        );
    }

    fillInMissingData(newTrip: NewTrip): NewTrip {
        const startTime = newTrip.startTime ?? DateConverter.getLocalNow(newTrip.timeZone);
        return new NewTripImpl(startTime, newTrip.timeZone, newTrip.notes, newTrip.tags, newTrip.species, newTrip.defaultSpecies);
    }

    createNewDynamoRecord(newTrip: NewTrip, subject: string): DynamoDbTrip {
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

    toTripDetails(record: DynamoDbTrip): TripDetails {
        return new TripDetailsImpl(
            record.subject,
            record.tripId,
            DateConverter.isoFromString(record.startTime),
            record.endTime ? DateConverter.isoFromString(record.endTime) : undefined,
            record.notes,
            record.catchSize,
            record.rating,
            new Set(record.tags),
            record.species,
            record.defaultSpecies
        );
    }

    private appendNotes(notes?: string, append?: string): string {
        if (!append) return notes ?? '';
        if (!notes) return append;
        return `${notes}\r\n${append}`;
    }
}