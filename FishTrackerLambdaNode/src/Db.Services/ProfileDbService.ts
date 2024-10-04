import { ProfileDetails, ProfileDetailsImpl, DynamoDbProfile, DynamoDbProfileImpl } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';


export class ProfileDbService extends DynamoDbService<DynamoDbProfile> {
    constructor(client: DynamoDBClient) {
        super(client, 'FishTracker-Profile-Prod', 'Subject');
    }

    async updateProfileInDynamoDb(record: DynamoDbProfile): Promise<HttpWrapper<DynamoDbProfile>> {
        return this.updateRecordWithoutSortKey('Subject', record.subject, record);
    }

    patchProfile(record: DynamoDbProfile, updateProfile: ProfileDetails): DynamoDbProfile {
        return new DynamoDbProfileImpl(
            record.subject,
            updateProfile.timeZone ?? record.timezone,
            updateProfile.species ?? record.species,
            updateProfile.defaultSpecies ?? record.defaultSpecies,
            record.dynamoDbVersion
        );
    }

    toProfileDetails(record: DynamoDbProfile): ProfileDetails {
        return new ProfileDetailsImpl(
            record.timezone,
            record.species,
            record.defaultSpecies
        );
    }

    buildDefault(subject: string): DynamoDbProfile {
        return new DynamoDbProfileImpl(
            subject,
            undefined,
            [],
            '',
            undefined
        );
    }
}