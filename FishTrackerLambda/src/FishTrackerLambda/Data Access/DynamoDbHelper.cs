using System.Collections.Concurrent;
using System.Globalization;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Persistance;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace FishTrackerLambda.DataAccess
{
    public static class DynamoDbHelper
    {
        public static async Task<HttpWrapper<T>> SaveDynamoDbRecord<T>(this T record, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::SaveDynamoDbRecord");

            var q = record;

            var context = new DynamoDBContext(client);
            await context.SaveAsync<T>(q);
            return HttpWrapper<T>.Ok(q);
        }

        public static async Task<HttpWrapper<T>> UpdateDynamoDbRecord<T>(this T record, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::SaveDynamoDbRecord");

            var q = record;

            var context = new DynamoDBContext(client);
            await context.SaveAsync<T>(q);

            return HttpWrapper<T>.Ok(q);
        }

        public static async Task<HttpWrapper<T>> DeleteDynamoDbRecord<T>(this T record, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::DeleteDynamoDbRecord");

            var q = record;

            var context = new DynamoDBContext(client);
            await context.DeleteAsync<T>(q);

            return HttpWrapper<T>.Ok(q);
        }

        public static async Task<HttpWrapper<T>> GetDynamoDbRecord<T, P, S>(P part, S sortKey, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecord part[{part}] sort[{sortKey}]");

            try
            {
                var context = new DynamoDBContext(client);
                var record = await context.LoadAsync<T>(part, sortKey);
                return record == null ? HttpWrapper<T>.NotFound : HttpWrapper<T>.Ok(record);
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetDynamoDbRecord:[{part}][{sortKey}] ResourceNotFoundException - creating empty");
                return HttpWrapper<T>.NotFound;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetDynamoDbRecord:[{part}][{sortKey}] Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }

        public static async Task<HttpWrapper<IEnumerable<T>>> GetDynamoDbRecords<T>(IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecords");

            try
            {
                var context = new DynamoDBContext(client);
                var conditions = new List<ScanCondition>();
                var query = context.ScanAsync<T>(conditions);
                var items = await query.GetRemainingAsync();
                return HttpWrapper<IEnumerable<T>>.Ok(items);
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetDynamoDbRecords:ResourceNotFoundException - creating empty");
                return HttpWrapper<IEnumerable<T>>.NotFound;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetDynamoDbRecords:Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }

        public static async Task<HttpWrapper<IEnumerable<T>>> GetDynamoDbRecords<T, P>(P part, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation($"DynamoDbHelper::GetDynamoDbRecords part[{part}]");

            try
            {
                var context = new DynamoDBContext(client);
                var query = context.QueryAsync<T>(part /*queryOptions*/);
                var items = await query.GetRemainingAsync();
                return HttpWrapper<IEnumerable<T>>.Ok(items);
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation($"GetDynamoDbRecords:[{part}] ResourceNotFoundException - creating empty");
                return HttpWrapper<IEnumerable<T>>.NotFound;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"GetDynamoDbRecords:[{part}] Exception:[{ex.Message}] [Type[{ex.GetType()}]");
                throw;
            }
        }

        public static async Task<HttpWrapper<IEnumerable<T>>> GetDynamoDbRecordsBySortKeyRange<T, P>(P partitionKey, string partKeyName, string sortKeyName, string lowerBound, string upperBound, IAmazonDynamoDB client, ILogger logger)
        {
            logger.LogInformation("GetDynamoDbRecordsBySortKeyRange partitionKey[{partitionKey}], lowerBound[{lowerBound}], upperBound[{upperBound}]", partitionKey, lowerBound, upperBound);

            var typeT = typeof(T);
            var typeP = typeof(P);

            try
            {
                var context = new DynamoDBContext(client);
                QueryOperationConfig config = new QueryOperationConfig
                    {
                    KeyExpression = new Expression
                    {
                        ExpressionStatement = "#partitionKey = :partitionKey AND #sortKey BETWEEN :lowerBound AND :upperBound",
                        ExpressionAttributeNames = new Dictionary<string, string>
                            {
                                { "#partitionKey", partKeyName },
                                { "#sortKey", sortKeyName }
                            },
                        ExpressionAttributeValues = new Dictionary<string, DynamoDBEntry>
                            {
                                { ":partitionKey", partitionKey?.ToString() ?? "" },
                                { ":lowerBound", lowerBound },
                                { ":upperBound", upperBound }
                            }
                    }
                };
                var query = context.FromQueryAsync<T>(config);
                var items = await query.GetRemainingAsync();
                return HttpWrapper<IEnumerable<T>>.Ok(items);
            }
            catch (ResourceNotFoundException)
            {
                logger.LogInformation("GetDynamoDbRecordsBySortKeyRange:[{partitionKey}] ResourceNotFoundException - creating empty", partitionKey);
                return HttpWrapper<IEnumerable<T>>.NotFound;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetDynamoDbRecordsBySortKeyRange partitionKey[{partitionKey}], lowerBound[{lowerBound}], upperBound[{upperBound}]  Exception:[{message}] Type[{type}]", partitionKey, lowerBound, upperBound, ex.Message, ex.GetType());
                throw;
            }
        }
    }
}
