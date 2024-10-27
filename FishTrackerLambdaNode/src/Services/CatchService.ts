import { injectable } from 'tsyringe';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { IdGenerator } from '../Helpers/IdGenerator';
import { ICatchDetails, INewCatch, IUpdateCatchDetails, IDynamoDbCatch } from '../Models/lambda';
import { CatchDbService } from '../Db.Services/CatchDbService';
import { Results } from '../Http/Result';

@injectable()
export class CatchService {
    private catchService: CatchDbService;

    constructor(catchService: CatchDbService) {
        this.catchService = catchService
    }

    async getCatch(subject: string, tripId: string, catchId: string): Promise<HttpWrapper<ICatchDetails>> {
        const tripKey = IdGenerator.generateTripKey(subject, tripId);
        const catchRecord = await this.catchService.readRecordWithSortKey(tripKey, catchId);
        return catchRecord.Map(c => CatchDbService.toCatchDetails(c));
    }

    async getTripCatch(subject: string, tripId: string): Promise<HttpWrapper<ICatchDetails[]>> {
        const tripKey = IdGenerator.generateTripKey(subject, tripId);
        // const catchRecords = await this.catchService.readAllRecordsForPartition(tripKey);
        // return catchRecords.Map(c => c.map(r => CatchDbService.toCatchDetails(r)));
        return (await this.catchService
            .readAllRecordsForPartition(tripKey))
            .Map(c => c.map(r => CatchDbService.toCatchDetails(r)));
    }

    async newCatch(subject: string, tripId: string, newCatch: INewCatch): Promise<HttpWrapper<ICatchDetails>> {
        return (await (await (await HttpWrapper.Init(newCatch))
            .ValidateInput(c => {
                return c.timeZone ? null : Results.NotFound("Must supply timezone");
            })
            .Set(CatchDbService.fillInMissingData(newCatch))
            .Map(c => CatchDbService.createNewDynamoRecord(c, subject, tripId))
            .MapAsync(c => CatchDbService.addBiteTimes(c, newCatch.timeZone)))
            .MapAsync(c => this.catchService.createRecord(c)))
            .Map(d => CatchDbService.toCatchDetails(d));
    }

    async patchCatch(subject: string, tripId: string, catchId: string, updateCatch: IUpdateCatchDetails): Promise<HttpWrapper<ICatchDetails>> {
        const tripKey = IdGenerator.generateTripKey(subject, tripId);
        return await (await (await (await this.catchService.readRecordWithSortKey(tripKey, catchId))
            .Map(c => CatchDbService.patchCatch(c, updateCatch)))
            .MapAsync(c => this.catchService.updateCatchDetails(c)))
            .Map(c => CatchDbService.toCatchDetails(c));
    }

    async updateCatch(subject: string, tripId: string, catchId: string, updateCatch: ICatchDetails): Promise<HttpWrapper<ICatchDetails>> {
        return (await (await HttpWrapper.Init(updateCatch)
            .ValidateInput(c => {
                return tripId === c.tripId ? null : Results.NotFound(`Cannot change tripId from [${tripId}] to [${c.tripId}]`);
            })
            .ValidateInput(c => {
                return catchId === c.catchId ? null : Results.NotFound(`Cannot change catchId from [${catchId}] to [${c.catchId}]`);
            })
            .MapAsync(() => this.catchService.readRecordWithSortKey(IdGenerator.generateTripKey(subject, tripId), updateCatch.catchId)))
            .Map(c => CatchDbService.updateCatch(c, updateCatch))
            .MapAsync(c => this.catchService.updateCatchDetails(c)))
            .Map(c => CatchDbService.toCatchDetails(c));
    }

    async patchFixup(subject: string, action: string, option?: string): Promise<HttpWrapper<any>> {
        if (action === 'bitetimes') {
            return await (await (await this.catchService.readAllRecords())
                .MapEachAsync<IDynamoDbCatch, IDynamoDbCatch>(c => this.catchService.fixupBiteTimes(c)))
                .Map(c => c.map(r => CatchDbService.toCatchDetails(r)));
        }
        return HttpWrapper.FromResult(Results.NotFound('Unknown action'));
    }    
}
