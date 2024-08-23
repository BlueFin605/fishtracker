using Amazon.DynamoDBv2;
using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.Services
{
    public class ProfileService : IProfileService
    {
        private readonly ILogger<ProfileService> m_logger;

        private readonly IAmazonDynamoDB m_client;

        public ProfileService(ILogger<ProfileService> logger, IAmazonDynamoDB client)
        {
            m_logger = logger;
            m_client = client;
        }

        public Task<HttpWrapper<ProfileDetails>> GetProfile(string subject)
        {
            return ProfileDbTable.ReadProfileFromDynamodb(subject, m_client, m_logger)
                .OnResult(404, () => ProfileDbTable.BuildDefault(subject))
                .Map(c => c.ToProfileDetails());
        }

        public Task<HttpWrapper<ProfileDetails>> UpdateProfile(string subject, ProfileDetails updateCatch)
        {
            return ProfileDbTable.ReadProfileFromDynamodb(subject, m_client, m_logger)
                .OnResult(404, () => ProfileDbTable.BuildDefault(subject))
                .Map(c => c.PatchProfile(updateCatch))
                .MapAsync(c => c.UpdateProfileInDynamodb(m_client, m_logger))
                .Map(c => c.ToProfileDetails());
        }
    }
}

