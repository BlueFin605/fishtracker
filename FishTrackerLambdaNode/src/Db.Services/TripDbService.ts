import { injectable } from 'tsyringe';
import { DateTime } from 'luxon';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { IDynamoDbTrip, DynamoDbTrip, IUpdateTripDetails, ITripDetails, TripDetails, IEndTripDetails, INewTrip, NewTrip, TripRating, ITripTags } from '../Models/lambda';
import { IdGenerator } from '../Helpers/IdGenerator';
import { DateConverter } from '../Helpers/DateConverter';
import { DynamoDbHelper } from './AWSWrapper';
import { StringToEnum, EnumToString } from '../Http/serialisation';
import { calcMoonPhase, IBiteDetails } from '../Services/BiteTimes';

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
            trip.moonPhase ?? record.MoonPhase,
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
            StringToEnum(TripRating, trip.rating) ?? TripRating.NonRated,
            [...trip.tags],
            trip.species,
            trip.defaultSpecies,
            trip.moonPhase,
            record.DynamoDbVersion
        );
    }

    endTrip(record: IDynamoDbTrip, trip: IEndTripDetails, size: number): IDynamoDbTrip {
        const endTime:DateTime = trip.endTime ? DateConverter.convertUtcToLocal(DateConverter.isoFromString(trip.endTime), trip.timeZone) 
                                     : DateConverter.getLocalNow(trip.timeZone);
        return new DynamoDbTrip(
            record.Subject,
            record.TripId,
            record.StartTime,
            DateConverter.isoToString(endTime),
            TripDbService.appendNotes(record.Notes, trip.notes),
            size,
            trip.rating ?? record.Rating,
            Array.isArray(trip.tags) ? trip.tags : Array.from(trip.tags ?? record.Tags),
            record.Species,
            record.DefaultSpecies,
            record.MoonPhase,
            record.DynamoDbVersion
        );
    }

    static fillInMissingData(newTrip: INewTrip): INewTrip {
        // let startTime = newTrip.startTime ?? DateConverter.isoToString(DateConverter.getLocalNow(newTrip.timeZone));
        const startTime:DateTime = newTrip.startTime ? DateConverter.convertUtcToLocal(DateConverter.isoFromString(newTrip.startTime), newTrip.timeZone) 
                                     : DateConverter.getLocalNow(newTrip.timeZone);

        return new NewTrip(DateConverter.isoToString(startTime), newTrip.timeZone, newTrip.notes, newTrip.tags, newTrip.species, newTrip.defaultSpecies);
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
            '',
            undefined
        );
    }


    static async addBiteTimes(c: IDynamoDbTrip): Promise<HttpWrapper<IDynamoDbTrip>> {
        return HttpWrapper.Ok({
            ...c,
            MoonPhase: calcMoonPhase(new Date(c.StartTime))
        });
    }

    static toTripDetails(record: IDynamoDbTrip): ITripDetails {
        return new TripDetails(
            record.Subject,
            record.TripId,
            record.StartTime,
            record.EndTime,
            record.Notes,
            record.CatchSize,
            EnumToString(TripRating, record.Rating) ?? "NonRated",
            record.Tags,
            record.Species,
            record.DefaultSpecies,
            record.MoonPhase
        );
    }

    static appendNotes(notes?: string, append?: string): string {
        if (!append) return notes ?? '';
        if (!notes) return append;
        return `${notes}\r\n${append}`;
    }

    async fixupMoonPhase(c: IDynamoDbTrip): Promise<HttpWrapper<IDynamoDbTrip>> {
        const moonPhase = await calcMoonPhase(new Date(c.StartTime));
        if (!moonPhase)
            return HttpWrapper.Ok(c);

        const updated = {
            ...c,
            MoonPhase: moonPhase
        };

        return this.updateTripInDynamoDb(updated);
    }

}