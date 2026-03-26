import { injectable } from 'tsyringe';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { IdGenerator } from '../Helpers/IdGenerator';
import { ICatchDetails, INewCatch, IUpdateCatchDetails, IDynamoDbCatch, IDynamoDbTrip } from '../Models/lambda';
import { CatchDbService } from '../Db.Services/CatchDbService';
import { TripDbService } from '../Db.Services/TripDbService';
import { Results } from '../Http/Result';

@injectable()
export class CatchService {
    private catchService: CatchDbService;
    private tripService: TripDbService;

    constructor(catchService: CatchDbService, tripService: TripDbService) {
        this.catchService = catchService
        this.tripService = tripService
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

        if (action === 'moonphase') {
            return await (await (await this.tripService.readAllRecords())
                .MapEachAsync<IDynamoDbTrip, IDynamoDbTrip>(c => this.tripService.fixupMoonPhase(c)))
                .Map(c => c.map(r => TripDbService.toTripDetails(r)));
        }

        if (action === 'species') {
            // Normalise species on catches
            const catchResult = await (await (await this.catchService.readAllRecords())
                .MapEachAsync<IDynamoDbCatch, IDynamoDbCatch>(c => this.fixupSpeciesName(c)))
                .Map(c => c.map(r => CatchDbService.toCatchDetails(r)));

            // Normalise species on trips
            await (await this.tripService.readAllRecords())
                .MapEachAsync<IDynamoDbTrip, IDynamoDbTrip>(c => this.fixupTripSpecies(c));

            return catchResult;
        }

        return HttpWrapper.FromResult(Results.NotFound('Unknown action'));
    }

    private static titleCase(str: string): string {
        return str.replace(/\w\S*/g, word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );
    }

    private async fixupTripSpecies(trip: IDynamoDbTrip): Promise<HttpWrapper<IDynamoDbTrip>> {
        const normalisedSpecies = (trip.Species || []).map(s => CatchService.titleCase(s));
        const normalisedDefault = trip.DefaultSpecies ? CatchService.titleCase(trip.DefaultSpecies) : trip.DefaultSpecies;

        const speciesChanged = JSON.stringify(normalisedSpecies) !== JSON.stringify(trip.Species);
        const defaultChanged = normalisedDefault !== trip.DefaultSpecies;

        if (!speciesChanged && !defaultChanged) {
            return HttpWrapper.Ok(trip);
        }

        const updated = { ...trip, Species: normalisedSpecies, DefaultSpecies: normalisedDefault || '' };
        return this.tripService.updateTripInDynamoDb(updated);
    }

    private async fixupSpeciesName(c: IDynamoDbCatch): Promise<HttpWrapper<IDynamoDbCatch>> {
        const normalised = CatchService.titleCase(c.SpeciesId);

        if (normalised === c.SpeciesId) {
            return HttpWrapper.Ok(c);
        }

        const updated = { ...c, SpeciesId: normalised };
        return this.catchService.updateCatchDetails(updated);
    }
}
