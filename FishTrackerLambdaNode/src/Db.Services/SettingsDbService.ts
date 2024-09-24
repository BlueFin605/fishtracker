import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { SettingsDetails, SettingsDetailsImpl, DynamoDbSettings, DynamoDbSettingsImpl } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';

export class SettingsDbService extends DynamoDbService<DynamoDbSettings> {
    constructor(client: DocumentClient) {
        super('FishTracker-Settings-Prod', 'Settings');
    }

    async updateSettingsInDynamoDb(record: DynamoDbSettings): Promise<HttpWrapper<DynamoDbSettings>> {
        return this.updateRecordWithoutSortKey('Settings', record.settings, record);
    }

    async readSettingsFromDynamoDb(): Promise<HttpWrapper<DynamoDbSettings>> {
        return this.readRecord('global');
    }

    patchSettings(record: DynamoDbSettings, updateSettings: SettingsDetails): DynamoDbSettings {
        return new DynamoDbSettingsImpl(
            'global',
            updateSettings.species ?? record.species,
            record.dynamoDbVersion
        );
    }

    toSettingsDetails(record: DynamoDbSettings): SettingsDetails {
        return new SettingsDetailsImpl(
            record.species
        );
    }

    buildDefault(): DynamoDbSettings {
        return new DynamoDbSettingsImpl(
            'global',
            [],
            undefined
        );
    }
}