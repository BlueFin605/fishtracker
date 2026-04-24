using Amazon.DynamoDBv2;
using FishTrackerLambda.Models.Persistance;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.DataAccess
{
    public class DynamoShareRepository : IShareRepository
    {
        private readonly IAmazonDynamoDB _ddb;
        private readonly string _tableName;
        private readonly ILogger<DynamoShareRepository> _log;

        public DynamoShareRepository(IAmazonDynamoDB ddb, string tableName, ILogger<DynamoShareRepository> log)
        {
            _ddb = ddb;
            _tableName = tableName;
            _log = log;
        }

        public async Task<DynamoDbShare?> GetByOwner(string ownerSubject, string shareId)
        {
            var w = await ShareDbTable.ReadShareByOwner(ownerSubject, shareId, _ddb, _log);
            return w.Result.StatusCode == 200 ? w.Value : null;
        }

        public async Task<List<DynamoDbShare>> ListByOwner(string ownerSubject)
        {
            var w = await ShareDbTable.ReadSharesByOwner(ownerSubject, _ddb, _log);
            return w.Result.StatusCode == 200 ? (w.Value?.ToList() ?? new()) : new();
        }

        public async Task<DynamoDbShare?> GetByShareId(string shareId)
        {
            var w = await ShareDbTable.ReadShareByShareId(shareId, _ddb, _tableName, _log);
            return w.Result.StatusCode == 200 ? w.Value : null;
        }

        public async Task<List<DynamoDbShare>> ListByRecipientEmail(string lowerCaseEmail)
        {
            var w = await ShareDbTable.ReadSharesByRecipientEmail(lowerCaseEmail, _ddb, _tableName, _log);
            return w.Result.StatusCode == 200 ? (w.Value?.ToList() ?? new()) : new();
        }

        public async Task<DynamoDbShare> Save(DynamoDbShare share)
        {
            var w = await share.WriteShareToDynamoDb(_ddb, _log);
            return w.Value!;
        }

        public async Task<DynamoDbShare> Update(DynamoDbShare share)
        {
            var w = await share.UpdateShareInDynamoDb(_ddb, _log);
            return w.Value!;
        }
    }
}
