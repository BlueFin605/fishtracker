import { DocumentClient } from 'aws-sdk/clients/dynamodb';
// import { CatchDbTable } from '../../DataAccess/CatchDbTable';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { IdGenerator } from '../Helpers/IdGenerator';
import { CatchDetails, NewCatch, UpdateCatchDetails } from '../Models/lambda';
import { CatchDbService } from '../Db.Services/CatchDbService';
// import { CatchDetails, NewCatch, UpdateCatchDetails } from '../Models/Lambda';
// import { ILogger } from '../Services/Http/ILogger';
// import { Function } from '../Services/Http/Function';

export class CatchService {
    private client: DocumentClient;
    private catchService: CatchDbService;

    constructor(client: DocumentClient, catchService: CatchDbService) {
        this.client = client;
        this.catchService = catchService
    }

    async getCatch(subject: string, tripId: string, catchId: string): Promise<HttpWrapper<CatchDetails>> {
        const tripKey = IdGenerator.generateTripKey(subject, tripId);
        const catchRecord = await this.catchService.readRecordWithSortKey(tripKey, catchId);
        return catchRecord.Map(c => CatchDbService.toCatchDetails(c));
    }

    async getTripCatch(subject: string, tripId: string): Promise<HttpWrapper<CatchDetails[]>> {
        const tripKey = IdGenerator.generateTripKey(subject, tripId);
        // const catchRecords = await this.catchService.readAllRecordsForPartition(tripKey);
        // return catchRecords.Map(c => c.map(r => CatchDbService.toCatchDetails(r)));
        return (await this.catchService
            .readAllRecordsForPartition(tripKey))
            .Map(c => c.map(r => CatchDbService.toCatchDetails(r)));
    }

    async newCatch(subject: string, tripId: string, newCatch: NewCatch): Promise<HttpWrapper<CatchDetails>> {
        return (await (await HttpWrapper.Init(newCatch))
            .ValidateInput(c => {
                return c.caughtWhen || c.timeZone ? null : { statusCode: 400, message: "Must supply either a datetime or timezone" };
            })
            .Set(CatchDbService.fillInMissingData(newCatch))
            .Map(c => CatchDbService.createNewDynamoRecord(c, subject, tripId))
            .MapAsync(c => this.catchService.createRecord(c)))
            .Map(d => CatchDbService.toCatchDetails(d));
    }

    async patchCatch(subject: string, tripId: string, catchId: string, updateCatch: UpdateCatchDetails): Promise<HttpWrapper<CatchDetails>> {
        const tripKey = IdGenerator.generateTripKey(subject, tripId);
        return await (await (await (await this.catchService.readRecordWithSortKey(tripKey, catchId))
            .Map(c => CatchDbService.patchCatch(c, updateCatch)))
            .MapAsync(c => this.catchService.updateCatchDetails(c)))
            .Map(c => CatchDbService.toCatchDetails(c));
    }

    async updateCatch(subject: string, tripId: string, catchId: string, updateCatch: CatchDetails): Promise<HttpWrapper<CatchDetails>> {
        return (await (await HttpWrapper.Init(updateCatch)
            .ValidateInput(c => {
                return tripId === c.tripId ? null : { statusCode: 400, message: `Cannot change tripId from [${tripId}] to [${c.tripId}]` };
            })
            .ValidateInput(c => {
                return catchId === c.catchId ? null : { statusCode: 400, message: `Cannot change catchId from [${catchId}] to [${c.catchId}]` };
            })
            .MapAsync(() => this.catchService.readRecordWithSortKey(IdGenerator.generateTripKey(subject, tripId), updateCatch.catchId)))
            .Map(c => CatchDbService.updateCatch(c, updateCatch))
            .MapAsync(c => this.catchService.updateCatchDetails(c)))
            .Map(c => CatchDbService.toCatchDetails(c));
    }
}
