import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { container, inject, injectable } from 'tsyringe';
import { ITripDetails, INewTrip, IUpdateTripDetails, IEndTripDetails, IDynamoDbCatch, ICatchDetails } from '../Models/lambda';
import { TripDbService } from '../Db.Services/TripDbService';
import { CatchDbService } from '../Db.Services/CatchDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { IdGenerator } from '../Helpers/IdGenerator';

@injectable()
export class TripService {
    private tripService: TripDbService;
    private catchService: CatchDbService;

    constructor(tripService: TripDbService, catchService: CatchDbService) {
        this.tripService = tripService
        this.catchService = catchService
    }

    public async getTrip(subject: string, tripId: string): Promise<HttpWrapper<ITripDetails>> {
        const tripRecord = await this.tripService.readRecordWithSortKey(subject, tripId);
        return tripRecord.Map(c => TripDbService.toTripDetails(c));
    }

    public async getTrips(subject: string, view?: string): Promise<HttpWrapper<ITripDetails[]>> {
        switch (view) {
            case null:
            case 'all':
                return (await this.tripService
                    .readAllRecordsForPartition(subject))
                    .Map(c => {console.log(c); return c})
                    .Map(c => {console.log(JSON.stringify(c)); return c})
                    .Map(c => c.map(r => TripDbService.toTripDetails(r)));
            case 'relevant':
                return (await this.tripService
                    .readRelevantTripsFromDynamoDb(subject))
                    .Map(c => c.map(r => TripDbService.toTripDetails(r)));
            default:
                throw new Error(`invalid view[${view}]`);
        }
    }

    public async newTrip(subject: string, newTrip: INewTrip): Promise<HttpWrapper<ITripDetails>> {
        return (await (await HttpWrapper.Init(newTrip))
            .ValidateInput(c => {
                return newTrip.startTime != null || newTrip.timeZone != null ? null : { statusCode: 400, message: 'Must supply either a datetime or timezone'};                
            })
            .Set(TripDbService.fillInMissingData(newTrip))
            .Map(c => TripDbService.createNewDynamoRecord(c, subject))
            .MapAsync(c => this.tripService.createRecord(c)))
            .Map(d => TripDbService.toTripDetails(d));
    }

    public async updateTrip(subject: string, tripId: string, updateTrip: ITripDetails): Promise<HttpWrapper<ITripDetails>> {
        return (await (await HttpWrapper.Init(updateTrip)
            .ValidateInput(c => {
                return tripId === c.tripId ? null : { statusCode: 400, message: `Cannot change tripId from [${tripId}] to [${c.tripId}]` };
            })
            .MapAsync(() => this.tripService.readRecordWithSortKey(subject, updateTrip.tripId)))
            .Map(c => TripDbService.updateTrip(c, updateTrip))
            .MapAsync(c => this.tripService.updateTripInDynamoDb(c)))
            .Map(c => TripDbService.toTripDetails(c));
    }

    public async patchTrip(subject: string, tripId: string, updateTrip: IUpdateTripDetails): Promise<HttpWrapper<ITripDetails>> {
        return await (await (await (await this.tripService.readRecordWithSortKey(subject, tripId))
            .Map(c => TripDbService.patchTrip(c, updateTrip)))
            .MapAsync(c => this.tripService.updateTripInDynamoDb(c)))
            .Map(c => TripDbService.toTripDetails(c));
    }

    public async deleteTrip(subject: string, tripId: string): Promise<HttpWrapper<ICatchDetails[]>> {
        return await (await (await (await (await this.tripService.readRecordWithSortKey(subject, tripId))
            .Map(c => TripDbService.toTripDetails(c))
            .MapAsync(c => this.tripService.deleteRecord(c.tripId)))
            .MapAsync(c => this.catchService.readAllRecordsForPartition(c.TripId)))
            .MapEachAsync<IDynamoDbCatch, IDynamoDbCatch>(c => this.catchService.deleteRecord(c.TripId, c.CatchId)))
            .Map(c => c.map(r => CatchDbService.toCatchDetails(r)));
    }

    public async endTrip(subject: string, tripId: string, trip: IEndTripDetails): Promise<HttpWrapper<ITripDetails>> {
        return (await this.catchService.readAllRecordsForPartition(IdGenerator.generateTripKey(subject, tripId)))
            .MapAsync(async all => {
                return (await (await this.tripService.readRecordWithSortKey(subject, tripId))
                    .Map(c => this.tripService.endTrip(c, trip, all.length))
                    .MapAsync(c => this.tripService.updateTripInDynamoDb(c)))
                    .Map(c => TripDbService.toTripDetails(c));
            })
    }
}
