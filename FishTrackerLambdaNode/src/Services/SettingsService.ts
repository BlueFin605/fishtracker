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
}