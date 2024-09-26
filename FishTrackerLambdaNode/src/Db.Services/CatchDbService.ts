// const { DynamoDB, DocumentClient } = require('@aws-sdk/client-s3');
// const documentClient = new DocumentClient();
import { HttpWrapper } from '../Functional/HttpWrapper';
import { UpdateCatchDetails, CatchDetails, DynamoDbCatch, DynamoDbCatchImpl, NewCatch, NewCatchImpl, CatchDetailsImpl } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';
import { IdGenerator } from '../Helpers/IdGenerator';
import { DateConverter } from '../Helpers/DateConverter';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// import { DynamoDBDocumentClient } from '@aws-sdk/client-dynamodb';

export class CatchDbService extends DynamoDbService<DynamoDbCatch> {
    constructor(client: DynamoDBClient) {
        super('FishTracker-Catch-Prod', 'TripKey', 'CatchId');
    }

    public async updateCatchDetails(updateCatch: DynamoDbCatch): Promise<HttpWrapper<DynamoDbCatch>> {
        return this.updateRecord('TripKey', updateCatch.TripKey, 'CatchId', updateCatch.CatchId, updateCatch);
    }

    static patchCatch(record: DynamoDbCatch, updateCatch: UpdateCatchDetails): DynamoDbCatch {
        return new DynamoDbCatchImpl(
            record.TripKey,
            record.CatchId,
            record.TripId,
            record.Subject,
            updateCatch.speciesId ?? record.SpeciesId,
            updateCatch.caughtLocation ?? record.CaughtLocation,
            updateCatch.caughtWhen ?? record.CaughtWhen,
            updateCatch.caughtSize ?? record.CaughtSize,
            updateCatch.caughtLength ?? record.CaughtLength,
            updateCatch.weather ?? record.Weather,
            record.DynamoDbVersion
        )
    }

    static updateCatch(record: DynamoDbCatch, updateCatch: CatchDetails): DynamoDbCatch {
        return new DynamoDbCatchImpl(
            record.TripKey,
            record.CatchId,
            record.TripId,
            record.Subject,
            updateCatch.speciesId,
            updateCatch.caughtLocation,
            updateCatch.caughtWhen,
            updateCatch.caughtSize,
            updateCatch.caughtLength,
            updateCatch.weather,
            record.DynamoDbVersion
        );
    }
    static fillInMissingData(newCatch: NewCatch): NewCatch {
        const startTime = newCatch.caughtWhen ?? DateConverter.getLocalNow(newCatch.timeZone);
        return new NewCatchImpl(
            newCatch.speciesId,
            newCatch.caughtLocation,
            startTime,
            newCatch.timeZone,
            newCatch.caughtSize,
            newCatch.caughtLength
        );
    }

    static createNewDynamoRecord(newCatch: NewCatch, subject: string, tripId: string): DynamoDbCatchImpl {
        if (!newCatch.caughtWhen)
              throw new Error("Date should not be null")
        
        return new DynamoDbCatchImpl(
            IdGenerator.generateTripKey(subject, tripId),
            IdGenerator.generateUUID(),
            tripId,
            subject,
            newCatch.speciesId,
            newCatch.caughtLocation,
            newCatch.caughtWhen,
            newCatch.caughtSize,
            newCatch.caughtLength,
            undefined,
            undefined
        );
    }

    static toCatchDetails(c: DynamoDbCatch): CatchDetails {
        return new CatchDetailsImpl(
            c.TripId,
            c.CatchId,
            c.SpeciesId,
            c.CaughtLocation,
            new Date(c.CaughtWhen),
            c.CaughtSize,
            c.CaughtLength,
            c.Weather
        );
    }    
}