import { injectable } from 'tsyringe';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { ProfileDetails } from '../Models/lambda';
import { ProfileDbService } from '../Db.Services/ProfileDbService';

@injectable()
export class ProfileService {
    private ProfileService: ProfileDbService;

    constructor(ProfileService: ProfileDbService) {
        this.ProfileService = ProfileService
    }

    public async getProfile(subject: string): Promise<HttpWrapper<ProfileDetails>> {
        return await (await this.ProfileService.readRecord(subject))
            .OnResult(404, () => ProfileDbService.buildDefault(subject))
            .Map(c => ProfileDbService.toProfileDetails(c));
    }

    public async updateProfile(subject: string, updateProfile: ProfileDetails): Promise<HttpWrapper<ProfileDetails>> {
        return (await (await (await this.ProfileService.readRecord(subject))
            .OnResultAsync(404, () => this.ProfileService.createRecord(ProfileDbService.buildDefault(subject))))
            .Map(c => ProfileDbService.patchProfile(c, updateProfile))
            .MapAsync(c => this.ProfileService.updateProfileInDynamoDb(c)))
            .Map(c => ProfileDbService.toProfileDetails(c));
    }
}