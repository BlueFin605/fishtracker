import { injectable } from 'tsyringe';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { SettingsDetails } from '../Models/lambda';
import { SettingsDbService } from '../Db.Services/SettingsDbService';

@injectable()
export class SettingsService {
    private settingsService: SettingsDbService;

    constructor(settingsService: SettingsDbService) {
        this.settingsService = settingsService
    }

    public async getSettings(): Promise<HttpWrapper<SettingsDetails>> {
        return await (await this.settingsService.readRecord("global"))
            .OnResult(404, () => SettingsDbService.buildDefault())
            .Map(c => SettingsDbService.toSettingsDetails(c));
    }

    public async updateSettings(updateSettings: SettingsDetails): Promise<HttpWrapper<SettingsDetails>> {
        return (await (await (await this.settingsService.readRecord("global"))
            .OnResultAsync(404, () => this.settingsService.createRecord(SettingsDbService.buildDefault())))
            .Map(c => SettingsDbService.patchSettings(c, updateSettings))
            .MapAsync(c => this.settingsService.updateSettingsInDynamoDb(c)))
            .Map(c => SettingsDbService.toSettingsDetails(c));
    }
}