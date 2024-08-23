using Amazon.DynamoDBv2;
using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Helpers;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services.Http;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.Services
{ 
    public class SettingsService : ISettingsService
    {
        private readonly ILogger<SettingsService> m_logger;

        private readonly IAmazonDynamoDB m_client;

        public SettingsService(ILogger<SettingsService> logger, IAmazonDynamoDB client)
        {
            m_logger = logger;
            m_client = client;
        }

        public Task<HttpWrapper<SettingsDetails>> GetSettings()
        {
            return SettingsDbTable.ReadSettingsFromDynamodb(m_client, m_logger)
                .OnResult(404, () => SettingsDbTable.BuildDefault())
                .Map(c => c.ToSettingsDetails());
        }

        public Task<HttpWrapper<SettingsDetails>> UpdateSettings(SettingsDetails updateCatch)
        {
            return SettingsDbTable.ReadSettingsFromDynamodb(m_client, m_logger)
                .OnResult(404, () => SettingsDbTable.BuildDefault())
                .Map(c => c.PatchSettings(updateCatch))
                .MapAsync(c => c.UpdateSettingsInDynamodb(m_client, m_logger))
                .Map(c => c.ToSettingsDetails());
        }
    }
}

