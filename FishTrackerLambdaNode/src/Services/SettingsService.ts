import { injectable } from 'tsyringe';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { ISettingsDetails } from '../Models/lambda';
import { SettingsDbService } from '../Db.Services/SettingsDbService';

@injectable()
export class SettingsService {
    private settingsService: SettingsDbService;

    constructor(settingsService: SettingsDbService) {
        this.settingsService = settingsService
    }

    public async getSettings(): Promise<HttpWrapper<ISettingsDetails>> {
        return await (await this.settingsService.readRecord("global"))
            .OnResult(404, () => SettingsDbService.buildDefault())
            .Map(c => SettingsDbService.toSettingsDetails(c));
    }

    public async updateSettings(updateSettings: ISettingsDetails): Promise<HttpWrapper<ISettingsDetails>> {
        return (await (await (await this.settingsService.readRecord("global"))
            .OnResultAsync(404, () => this.settingsService.createRecord(SettingsDbService.buildDefault())))
            .Map(c => SettingsDbService.patchSettings(c, updateSettings))
            .MapAsync(c => this.settingsService.updateSettingsInDynamoDb(c)))
            .Map(c => SettingsDbService.toSettingsDetails(c));
    }

    public async addSpecies(speciesName: string): Promise<HttpWrapper<ISettingsDetails>> {
        const normalised = SettingsService.titleCase(speciesName.trim());
        if (!normalised) {
            return HttpWrapper.NotFound;
        }

        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const settingsResult = await (await this.settingsService.readRecord("global"))
                .OnResultAsync(404, () => this.settingsService.createRecord(SettingsDbService.buildDefault()));

            if (!settingsResult.continue || !settingsResult.value) {
                return settingsResult.Map(c => SettingsDbService.toSettingsDetails(c));
            }

            const existing = settingsResult.value.Species;
            const duplicate = existing.find(s => s.toLowerCase() === normalised.toLowerCase());
            if (duplicate) {
                return HttpWrapper.Ok(SettingsDbService.toSettingsDetails(settingsResult.value));
            }

            const updated = SettingsDbService.patchSettings(settingsResult.value, {
                species: [...existing, normalised]
            });

            const writeResult = await this.settingsService.updateSettingsInDynamoDb(updated);
            if (writeResult.continue) {
                return writeResult.Map(c => SettingsDbService.toSettingsDetails(c));
            }

            // Version conflict — retry
        }

        return HttpWrapper.NotFound;
    }

    private static titleCase(str: string): string {
        return str.replace(/\w\S*/g, word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );
    }
}