using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.Model;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Persistance;
using FishTrackerLambda.Services.Http;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.DataAccess
{
    public static class ShareDbTable
    {
        public static Task<HttpWrapper<DynamoDbShare>> WriteShareToDynamoDb(
            this DynamoDbShare record, IAmazonDynamoDB client, ILogger logger)
            => record.SaveDynamoDbRecord(client, logger);

        public static Task<HttpWrapper<DynamoDbShare>> UpdateShareInDynamoDb(
            this DynamoDbShare record, IAmazonDynamoDB client, ILogger logger)
            => record.UpdateDynamoDbRecord(client, logger);

        public static Task<HttpWrapper<DynamoDbShare>> ReadShareByOwner(
            string ownerSubject, string shareId, IAmazonDynamoDB client, ILogger logger)
            => DynamoDbHelper.GetDynamoDbRecord<DynamoDbShare, string, string>(
                ownerSubject, shareId, client, logger);

        public static Task<HttpWrapper<IEnumerable<DynamoDbShare>>> ReadSharesByOwner(
            string ownerSubject, IAmazonDynamoDB client, ILogger logger)
            => DynamoDbHelper.GetDynamoDbRecords<DynamoDbShare, string>(ownerSubject, client, logger);

        public static async Task<HttpWrapper<DynamoDbShare?>> ReadShareByShareId(
            string shareId, IAmazonDynamoDB client, string tableName, ILogger logger)
        {
            try
            {
                var resp = await client.QueryAsync(new QueryRequest
                {
                    TableName = tableName,
                    IndexName = "ShareId-Index",
                    KeyConditionExpression = "ShareId = :sid",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":sid"] = new AttributeValue { S = shareId }
                    },
                    Limit = 1
                });
                if (resp.Items == null || resp.Items.Count == 0)
                    return HttpWrapper<DynamoDbShare?>.Ok(null);
                var ctx = new DynamoDBContextBuilder().WithDynamoDBClient(() => client).Build();
                var doc = Amazon.DynamoDBv2.DocumentModel.Document.FromAttributeMap(resp.Items[0]);
                var share = ctx.FromDocument<DynamoDbShare>(doc);
                return HttpWrapper<DynamoDbShare?>.Ok(share);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ReadShareByShareId failed for {ShareId}", shareId);
                return HttpWrapper<DynamoDbShare?>.FromResult(Results.InternalServerError());
            }
        }

        public static async Task<HttpWrapper<IEnumerable<DynamoDbShare>>> ReadSharesByRecipientEmail(
            string lowerCaseEmail, IAmazonDynamoDB client, string tableName, ILogger logger)
        {
            try
            {
                var resp = await client.QueryAsync(new QueryRequest
                {
                    TableName = tableName,
                    IndexName = "RecipientEmail-Index",
                    KeyConditionExpression = "RecipientEmail = :e",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":e"] = new AttributeValue { S = lowerCaseEmail }
                    }
                });
                var ctx = new DynamoDBContextBuilder().WithDynamoDBClient(() => client).Build();
                var items = resp.Items ?? new List<Dictionary<string, AttributeValue>>();
                var shares = items
                    .Select(i => ctx.FromDocument<DynamoDbShare>(
                        Amazon.DynamoDBv2.DocumentModel.Document.FromAttributeMap(i)))
                    .ToList();
                return HttpWrapper<IEnumerable<DynamoDbShare>>.Ok(shares);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ReadSharesByRecipientEmail failed for {Email}", lowerCaseEmail);
                return HttpWrapper<IEnumerable<DynamoDbShare>>.FromResult(Results.InternalServerError());
            }
        }
    }
}
