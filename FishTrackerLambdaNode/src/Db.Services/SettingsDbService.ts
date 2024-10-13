import { injectable } from 'tsyringe';
import { ISettingsDetails, SettingsDetails, IDynamoDbSettings, DynamoDbSettings } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { DynamoDbHelper } from './AWSWrapper';

@injectable()
export class SettingsDbService extends DynamoDbService<IDynamoDbSettings> {
    constructor(client: DynamoDbHelper) {
        super(client, 'FishTracker-Settings-Prod', 'Settings');
    }

    async updateSettingsInDynamoDb(record: IDynamoDbSettings): Promise<HttpWrapper<IDynamoDbSettings>> {
        console.log('updateSettingsInDynamoDb', record);
        return this.updateRecordWithoutSortKey('Settings', record.Settings, record);
    }

    async readSettingsFromDynamoDb(): Promise<HttpWrapper<IDynamoDbSettings>> {
        return this.readRecord('global');
    }

    static patchSettings(record: IDynamoDbSettings, updateSettings: ISettingsDetails): IDynamoDbSettings {
        console.log('patchSettings', record, updateSettings);
        return new DynamoDbSettings(
            'global',
            updateSettings.species ?? record.Species,
            record.dynamoDbVersion
        );
    }

    static toSettingsDetails(record: IDynamoDbSettings): ISettingsDetails {
        return new SettingsDetails(
            record.Species
        );
    }

    static buildDefault(): IDynamoDbSettings {
        return new DynamoDbSettings(
            'global',
            [],
            undefined
        );
    }
}