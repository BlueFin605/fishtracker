import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { UpdateCatchDetails, CatchDetails, DynamoDbCatch, DynamoDbCatchImpl } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';

export class CatchDbService extends DynamoDbService<DynamoDbCatch> {

    constructor(client: DocumentClient) {
        super('FishTracker-Catch-Prod', 'TripKey', 'CatchId');
    }

    patchCatch(record: DynamoDbCatch, updateCatch: UpdateCatchDetails): DynamoDbCatch {
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

    updateCatch(record: DynamoDbCatch, updateCatch: CatchDetails): DynamoDbCatch {
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
}