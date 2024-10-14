import { injectable } from 'tsyringe';
import { IProfileDetails, ProfileDetails, IDynamoDbProfile, DynamoDbProfile } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { DynamoDbHelper } from './AWSWrapper';

@injectable()
export class ProfileDbService extends DynamoDbService<IDynamoDbProfile> {
    constructor(client: DynamoDbHelper) {
        super(client, 'FishTracker-Profile-Prod', 'Subject');
    }

    async updateProfileInDynamoDb(record: IDynamoDbProfile): Promise<HttpWrapper<IDynamoDbProfile>> {
        return this.updateRecordWithoutSortKey('Subject', record.Subject, record);
    }

    static patchProfile(record: IDynamoDbProfile, updateProfile: IProfileDetails): IDynamoDbProfile {
        return  new DynamoDbProfile(
            record.Subject,
            updateProfile.timeZone ?? record.Timezone,
            updateProfile.species ?? record.Species,
            updateProfile.defaultSpecies ?? record.DefaultSpecies,
            record.DynamoDbVersion
        );
    }

    static toProfileDetails(record: IDynamoDbProfile): IProfileDetails {
        return new ProfileDetails(
            record.Timezone,
            record.Species,
            record.DefaultSpecies
        );
    }

    static buildDefault(subject: string): IDynamoDbProfile {
        return new DynamoDbProfile(
            subject,
            undefined,
            [],
            '',
            undefined
        );
    }
}