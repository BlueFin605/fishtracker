import { injectable } from 'tsyringe';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { IDynamoDbTrip, DynamoDbTrip, IUpdateTripDetails, ITripDetails, TripDetails, IEndTripDetails, INewTrip, NewTrip, TripRating, ITripTags } from '../Models/lambda';
import { IdGenerator } from '../Helpers/IdGenerator';
import { DateConverter } from '../Helpers/DateConverter';
import { DynamoDbHelper } from './AWSWrapper';

@injectable()
export class TripDbService extends DynamoDbService<IDynamoDbTrip> {
    constructor(client: DynamoDbHelper) {
        super(client, 'FishTracker-Trips-Prod', 'Subject', 'TripId');
    }

    async updateTripInDynamoDb(record: IDynamoDbTrip): Promise<HttpWrapper<IDynamoDbTrip>> {
        return this.updateRecord('Subject', record.Subject, 'TripId', record.TripId, record);
    }

    async readRelevantTripsFromDynamoDb(subject: string): Promise<HttpWrapper<IDynamoDbTrip[]>> {
        const month = new Date().getMonth();
        const startSortValue = IdGenerator.generateTripKey(subject, (month - 1).toString().padStart(2, '0'));
        const endSortValue = IdGenerator.generateTripKey(subject, (month + 2).toString().padStart(2, '0'));
        return this.readRecordsBetweenSortKeys(subject, startSortValue, endSortValue);
    }

    static patchTrip(record: IDynamoDbTrip, trip: IUpdateTripDetails): IDynamoDbTrip {
        return new DynamoDbTrip(
            record.Subject,
            record.TripId,
            trip.startTime ?? record.StartTime,
            trip.endTime ?? (record.EndTime ? record.EndTime : undefined),
            TripDbService.appendNotes(record.Notes, trip.notes),
            trip.catchSize ?? record.CatchSize,
            trip.rating ?? record.Rating,
            Array.isArray(trip.tags) ? trip.tags : [...record.Tags],
            trip.species ?? record.Species,
            trip.defaultSpecies ?? record.DefaultSpecies,
            record.DynamoDbVersion
        );
    }

    static updateTrip(record: IDynamoDbTrip, trip: ITripDetails): IDynamoDbTrip {
        return new DynamoDbTrip(
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

    endTrip(record: IDynamoDbTrip, trip: IEndTripDetails, size: number): IDynamoDbTrip {
        const endTime = trip.endTime ?? DateConverter.isoToString(DateConverter.getLocalNow(trip.timeZone));
        return new DynamoDbTrip(
            record.Subject,
            record.TripId,
            record.StartTime,
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

    static fillInMissingData(newTrip: INewTrip): INewTrip {
        let startTime = newTrip.startTime ?? DateConverter.isoToString(DateConverter.getLocalNow(newTrip.timeZone));
        return new NewTrip(startTime, newTrip.timeZone, newTrip.notes, newTrip.tags, newTrip.species, newTrip.defaultSpecies);
    }

    static createNewDynamoRecord(newTrip: INewTrip, subject: string): IDynamoDbTrip {
        if (!newTrip.startTime) {
            throw new Error('Trip start time is required');
        }
        
        return new DynamoDbTrip(
            subject,
            IdGenerator.generateTripId(DateConverter.isoFromString(newTrip.startTime)),
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

    static toTripDetails(record: IDynamoDbTrip): ITripDetails {
        return new TripDetails(
            record.Subject,
            record.TripId,
            record.StartTime,
            record.EndTime,
            record.Notes,
            record.CatchSize,
            record.Rating,
            record.Tags,
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