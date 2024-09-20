import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { ProfileDetails, ProfileDetailsImpl, DynamoDbProfile, DynamoDbProfileImpl } from '../Models/lambda';
import { DynamoDbService } from './DynamoDbService';
import { HttpWrapper } from '../Functional/HttpWrapper';


export class ProfileDbService extends DynamoDbService<DynamoDbProfile> {
    constructor(client: DocumentClient) {
        super('FishTracker-Profile-Prod', 'Subject');
    }

    async updateProfileInDynamoDb(record: DynamoDbProfile): Promise<HttpWrapper<DynamoDbProfile>> {
        const updateExpression = 'set #timezone = :timezone, #species = :species, #defaultSpecies = :defaultSpecies';
        const expressionAttributeValues = {
            ':timezone': record.timezone,
            ':species': record.species,
            ':defaultSpecies': record.defaultSpecies
        };
        return this.updateRecord(record.subject, updateExpression, expressionAttributeValues);
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