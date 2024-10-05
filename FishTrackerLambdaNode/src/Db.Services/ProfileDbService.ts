import { injectable } from 'tsyringe';
import { ProfileDetails, ProfileDetailsImpl, DynamoDbProfile, DynamoDbProfileImpl } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { DynamoDbHelper } from './AWSWrapper';

@injectable()
export class ProfileDbService extends DynamoDbService<DynamoDbProfile> {
    constructor(client: DynamoDbHelper) {
        super(client, 'FishTracker-Profile-Prod', 'Subject');
    }

    async updateProfileInDynamoDb(record: DynamoDbProfile): Promise<HttpWrapper<DynamoDbProfile>> {
        return this.updateRecordWithoutSortKey('Subject', record.Subject, record);
    }

    static patchProfile(record: DynamoDbProfile, updateProfile: ProfileDetails): DynamoDbProfile {
        return  new DynamoDbProfileImpl(
            record.Subject,
            updateProfile.timeZone ?? record.Timezone,
            updateProfile.species ?? record.Species,
            updateProfile.defaultSpecies ?? record.DefaultSpecies,
            record.DynamoDbVersion
        );
    }

    static toProfileDetails(record: DynamoDbProfile): ProfileDetails {
        return new ProfileDetailsImpl(
            record.Timezone,
            record.Species,
            record.DefaultSpecies
        );
    }

    static buildDefault(subject: string): DynamoDbProfile {
        return new DynamoDbProfileImpl(
            subject,
            undefined,
            [],
            '',
            undefined
        );
    }
}