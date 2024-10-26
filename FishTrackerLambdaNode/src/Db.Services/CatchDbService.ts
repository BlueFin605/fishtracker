import { injectable } from 'tsyringe';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { FishSize, IUpdateCatchDetails, ICatchDetails, IDynamoDbCatch, DynamoDbCatch, INewCatch, NewCatch, CatchDetails, IBiteTime } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';
import { IdGenerator } from '../Helpers/IdGenerator';
import { DateConverter } from '../Helpers/DateConverter';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DateTime } from 'luxon';
import { DynamoDbHelper } from './AWSWrapper';
import { StringToEnum, EnumToString } from '../Http/serialisation';
import { biteTimes } from '../Services/BiteTimes';


@injectable()
export class CatchDbService extends DynamoDbService<IDynamoDbCatch> {
    constructor(client: DynamoDbHelper) {
        super(client, 'FishTracker-Catch-Prod', 'TripKey', 'CatchId');
    }

    public async updateCatchDetails(updateCatch: IDynamoDbCatch): Promise<HttpWrapper<IDynamoDbCatch>> {
        return this.updateRecord('TripKey', updateCatch.TripKey, 'CatchId', updateCatch.CatchId, updateCatch);
    }

    static patchCatch(record: IDynamoDbCatch, updateCatch: IUpdateCatchDetails): IDynamoDbCatch {
        return new DynamoDbCatch(
            record.TripKey,
            record.CatchId,
            record.TripId,
            record.Subject,
            updateCatch.speciesId ?? record.SpeciesId,
            updateCatch.caughtLocation ?? record.CaughtLocation,
            updateCatch.caughtWhen ? updateCatch.caughtWhen : record.CaughtWhen,
            StringToEnum(FishSize, updateCatch.caughtSize) ?? record.CaughtSize,
            updateCatch.caughtLength ?? record.CaughtLength,
            updateCatch.biteInfo ?? record.BiteInfo,
            record.DynamoDbVersion
        )
    }

    static updateCatch(record: IDynamoDbCatch, updateCatch: ICatchDetails): IDynamoDbCatch {
        return new DynamoDbCatch(
            record.TripKey,
            record.CatchId,
            record.TripId,
            record.Subject,
            updateCatch.speciesId,
            updateCatch.caughtLocation,
            updateCatch.caughtWhen,
            StringToEnum(FishSize, updateCatch.caughtSize),
            updateCatch.caughtLength,
            updateCatch.biteInfo,
            record.DynamoDbVersion
        );
    }
    static fillInMissingData(newCatch: INewCatch): INewCatch {
        // const startTime = newCatch.caughtWhen ?? DateConverter.isoToString(DateConverter.getLocalNow(newCatch.timeZone));

        const startTime:DateTime = newCatch.caughtWhen ? DateConverter.convertUtcToLocal(DateConverter.isoFromString(newCatch.caughtWhen), newCatch.timeZone) 
                                                       : DateConverter.getLocalNow(newCatch.timeZone);

        return new NewCatch(
            newCatch.speciesId,
            newCatch.caughtLocation,
            DateConverter.isoToString(startTime),
            newCatch.timeZone,
            newCatch.caughtSize,
            newCatch.caughtLength
        );
    }

    static createNewDynamoRecord(newCatch: INewCatch, subject: string, tripId: string): DynamoDbCatch {
        if (!newCatch.caughtWhen)
            throw new Error("Date should not be null")

        return new DynamoDbCatch(
            IdGenerator.generateTripKey(subject, tripId),
            IdGenerator.generateUUID(),
            tripId,
            subject,
            newCatch.speciesId,
            newCatch.caughtLocation,
            newCatch.caughtWhen,
            StringToEnum(FishSize, newCatch.caughtSize),
            newCatch.caughtLength,
            undefined,
            undefined
        );
    }


    static async addBiteTimes(c: IDynamoDbCatch, timeZone: string): Promise<HttpWrapper<IDynamoDbCatch>> {
        const biteInfo = await biteTimes(timeZone, DateConverter.isoFromString(c.CaughtWhen), c.CaughtLocation.latitude, c.CaughtLocation.longitude);
        if (!biteInfo)
            return HttpWrapper.Ok(c);
        
        return HttpWrapper.Ok({
            ...c,
            BiteInfo: {
                moonPhase: biteInfo.moonPhase,
                majorBiteTimes: biteInfo.majorBiteTimes.map(t => ({
                    start: DateConverter.isoToString(DateConverter.convertUtcToLocal(t.start,timeZone)),
                    end:   DateConverter.isoToString(DateConverter.convertUtcToLocal(t.end,  timeZone))
                    })) as IBiteTime[],                             
                minorBiteTimes: biteInfo.minorBiteTimes.map(t => ({
                    start: DateConverter.isoToString(DateConverter.convertUtcToLocal(t.start,timeZone)),
                    end:   DateConverter.isoToString(DateConverter.convertUtcToLocal(t.end,  timeZone))
                 })) as IBiteTime[],                             
                sunrise: DateConverter.isoToString(DateConverter.convertUtcToLocal(biteInfo.sunrise,timeZone)),
                sunset: DateConverter.isoToString(DateConverter.convertUtcToLocal(biteInfo.sunset,timeZone)),
                moonrise: biteInfo.moonrise != undefined ? DateConverter.isoToString(DateConverter.convertUtcToLocal(biteInfo.moonrise,timeZone)) : undefined, 
                moonset: biteInfo.moonset ? DateConverter.isoToString(DateConverter.convertUtcToLocal(biteInfo.moonset,timeZone)) : undefined, 
                moonover: biteInfo.moonover ? DateConverter.isoToString(DateConverter.convertUtcToLocal(biteInfo.moonover,timeZone)) : undefined,
                moonunder: biteInfo.moonunder ? DateConverter.isoToString(DateConverter.convertUtcToLocal(biteInfo.moonunder,timeZone)) : undefined,
                timeToSunrise: biteInfo.timeToSunrise,
                timeToSunset: biteInfo.timeToSunset
            }
        });
    }

    static toCatchDetails(c: IDynamoDbCatch): ICatchDetails {
        return new CatchDetails(
            c.TripId,
            c.CatchId,
            c.SpeciesId,
            c.CaughtLocation,
            c.CaughtWhen,
            EnumToString(FishSize, c.CaughtSize),
            c.CaughtLength,
            c.BiteInfo
        );
    }
}